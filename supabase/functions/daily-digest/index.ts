import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const todayStr = now.toISOString().split('T')[0]

  try {
    // 1. Fetch all profiles
    const { data: profiles } = await supabase.from('profiles').select('*')
    if (!profiles) throw new Error('Could not fetch laboratory profiles')

    for (const user of profiles) {
      const digestItems: string[] = []

      // 2. Query Notification Log for this user (Digest Mode)
      const { data: logs } = await supabase
        .from('notification_log')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('delivery_mode', 'digest')
        .gt('delivered_at', yesterday)

      if (logs && logs.length > 0) {
        logs.forEach(log => {
          digestItems.push(`&bull; ${log.subject}`)
        })
      }

      // 3. Check for Milestones Approaching
      const { data: milestones } = await supabase
        .from('milestones')
        .select('*, projects(name)')
        .eq('status', 'pending')
      
      milestones?.forEach(m => {
        const dueDate = new Date(m.due_date)
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        const threshold = m.alert_days_before || 3

        if (daysDiff === threshold || daysDiff === 1) {
           digestItems.push(`&bull; <b>Milestone Approaching:</b> "${m.name}" in ${m.projects.name} is due in ${daysDiff} day(s).`)
        }
      })

      // 4. Check for Phases Starting Soon
      const { data: phases } = await supabase
        .from('project_phases')
        .select('*, projects(name)')
      
      phases?.forEach(p => {
        const startDate = new Date(p.start_date)
        const daysDiff = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
        const threshold = p.alert_days_before || 3

        if (daysDiff === threshold || daysDiff === 1) {
           digestItems.push(`&bull; <b>Phase Starting:</b> "${p.name}" in ${p.projects.name} begins in ${daysDiff} day(s).`)
        }
      })

      // 5. Send Digest if items exist
      if (digestItems.length > 0) {
        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">SYNAPSE: Daily Laboratory Digest</h2>
            <p>Hello ${user.full_name || user.name}, here is your summary for ${todayStr}:</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              ${digestItems.join('<br><br>')}
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
              You received this email based on your Synapse notification preferences.
            </p>
          </div>
        `

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Synapse <notifications@nucleovir.com>',
            to: user.email,
            subject: `SYNAPSE: Daily Digest - ${todayStr}`,
            html: html
          })
        })

        // Log the digest send
        await supabase.from('notification_log').insert({
          recipient_id: user.id,
          event_type: 'daily_digest',
          subject: `Daily Digest for ${todayStr}`,
          delivery_mode: 'instant' // The digest itself is sent instantly by this function
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
