import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    // 1. Fetch all members and their active tasks
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'member')

    if (userError) throw userError

    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'done')

    if (taskError) throw taskError

    const results = []

    for (const user of users) {
      const myTasks = tasks.filter(t => t.assignee_ids?.includes(user.id))
      const totalHours = myTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      const capacity = user.weekly_capacity_hours || 40

      if (totalHours > capacity) {
        const percentage = Math.round((totalHours / capacity) * 100)
        
        // 2. CHECK PREFERENCES
        const { data: pref } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', user.id)
            .eq('event_type', 'researcher_overload')
            .single()
        
        if (pref && !pref.enabled) {
            results.push({ user: user.id, status: 'skipped_by_pref' })
            continue
        }

        // 3. DEDUPLICATION (1-hour window)
        const windowStart = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        const { data: existingLog } = await supabase
            .from('notification_log')
            .select('id')
            .eq('recipient_id', user.id)
            .eq('event_type', 'researcher_overload')
            .gt('delivered_at', windowStart)
            .limit(1)
        
        if (existingLog && existingLog.length > 0) {
            results.push({ user: user.id, status: 'deduplicated' })
            continue
        }

        const subject = `CRITICAL: Capacity Overload Alert - ${user.name} (${percentage}%)`
        const html = `
            <h2>Laboratory Utilization Alert</h2>
            <p>Researcher <strong>${user.name}</strong> has exceeded their weekly capacity.</p>
            <ul>
              <li><strong>Current Workload:</strong> ${totalHours} Hours</li>
              <li><strong>Weekly Capacity:</strong> ${capacity} Hours</li>
              <li><strong>Utilization:</strong> ${percentage}%</li>
            </ul>
            <p>Please review task assignments in the Synapse Admin Control Center.</p>
        `

        // 4. Dispatch Email via Resend
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Synapse <notifications@nucleovir.com>',
            to: [user.email],
            subject: subject,
            html: html
          })
        })

        // 5. LOG NOTIFICATION
        await supabase.from('notification_log').insert({
          recipient_id: user.id,
          event_type: 'researcher_overload',
          subject: subject,
          delivery_mode: 'instant'
        })
        
        results.push({ user: user.id, status: 'overload', notified: true })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
