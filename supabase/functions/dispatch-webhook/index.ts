import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { platform, event_type, payload } = await req.json()
    
    // 1. Determine the Webhook URL
    let webhookUrl = platform === 'slack' 
      ? Deno.env.get('SLACK_WEBHOOK_URL') 
      : Deno.env.get('DISCORD_WEBHOOK_URL');

    if (event_type === 'daily_digest') {
      const { data: settings } = await supabase.from('workspace_settings').select('*').single();
      webhookUrl = platform === 'slack' ? settings?.slack_digest_channel : settings?.discord_digest_channel;
    }

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: 'No webhook URL configured for this target' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Format the message
    const message = platform === 'slack' 
      ? formatSlack(event_type, payload)
      : formatDiscord(event_type, payload);

    // 3. Dispatch
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Platform responded with ${response.status}: ${await response.text()}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function formatSlack(type: string, payload: any) {
  const baseUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';
  
  switch (type) {
    case 'approval_request_received':
      return {
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*Pending Clinical Review Required*\n*Task:* ${payload.taskName}\n*Requester:* ${payload.requesterName}\n*Project:* ${payload.projectName}` }
          },
          {
            type: "actions",
            elements: [{
              type: "button",
              text: { type: "plain_text", text: "Review Now" },
              url: `${baseUrl}/projects/${payload.projectId}?task=${payload.taskId}`,
              style: "primary"
            }]
          }
        ]
      };
    case 'approval_resolved':
      return {
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: `*Review Decision: ${payload.status === 'approved' ? '✅ Approved' : '❌ Rejected'}*\n*Task:* ${payload.taskName}\n*Reviewer:* ${payload.reviewerName}` }
        }]
      };
    case 'researcher_overload':
      return {
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: `*⚠️ Clinical Overload Alert*\n*Researcher:* ${payload.researcherName}\n*Workload:* ${payload.hours}/${payload.capacity} hours\n*Week:* ${payload.week}` }
        }]
      };
    case 'task_assigned':
      return {
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: `*New Task Assignment*\n*Task:* ${payload.taskName}\n*Project:* ${payload.projectName}\n*Due:* ${payload.dueDate}\n*Assigner:* ${payload.assignerName}` }
        }]
      };
    case 'task_status_changed':
      return {
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: `*Task Status Update*\n*Task:* ${payload.taskName}\n*Transition:* ${payload.oldStatus} → ${payload.newStatus}\n*Changed By:* ${payload.changedBy}` }
        }]
      };
    case 'milestone_approaching':
      return {
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: `*🏁 Milestone Threshold Alert*\n*Milestone:* ${payload.milestoneName}\n*Project:* ${payload.projectName}\n*T-Minus:* ${payload.daysRemaining} days` }
        }]
      };
    case 'document_published':
      return {
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: `*📄 Document Released into Repository*\n*Document:* ${payload.documentName}\n*Project:* ${payload.projectName}\n*Curator:* ${payload.publishedBy}` }
        }]
      };
    case 'stakeholder_feedback_received':
      return {
        blocks: [{
          type: "section",
          text: { type: "mrkdwn", text: `*💬 External Stakeholder Feedback*\n*Stakeholder:* ${payload.stakeholderName}\n*Document:* ${payload.documentName}\n*Feedback Excerpt:* "${payload.feedback.substring(0, 100)}..."` }
        }]
      };
    case 'daily_digest':
      return {
        blocks: [
          { type: "header", text: { type: "plain_text", text: "🧬 Daily Synapse Summary" } },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Tasks Updated:* ${payload.tasksUpdated}` },
              { type: "mrkdwn", text: `*Approvals Pending:* ${payload.approvalsPending}` },
              { type: "mrkdwn", text: `*Milestones Due This Week:* ${payload.milestonesThisWeek}` }
            ]
          }
        ]
      };
    default:
      return { text: `Clinical Event: ${type}` };
  }
}

function formatDiscord(type: string, payload: any) {
  const urgencyColors = {
    urgent: 0xE53E3E, // red
    info: 0x4299E1,   // blue
    success: 0x48BB78  // green
  };

  const timestamp = new Date().toISOString();
  
  const getEmbed = (title: string, description: string, color: number, fields: any[] = []) => ({
    embeds: [{ title, description, color, fields, timestamp }]
  });

  switch (type) {
    case 'approval_request_received':
      return getEmbed(
        "Pending Clinical Review",
        `**Task:** ${payload.taskName}\n**Requester:** ${payload.requesterName}\n**Project:** ${payload.projectName}`,
        urgencyColors.urgent
      );
    case 'approval_resolved':
      return getEmbed(
        `Review Action: ${payload.status === 'approved' ? 'Approved' : 'Rejected'}`,
        `**Task:** ${payload.taskName}\n**Reviewer:** ${payload.reviewerName}`,
        payload.status === 'approved' ? urgencyColors.success : urgencyColors.urgent
      );
    case 'researcher_overload':
      return getEmbed(
        "Clinical Overload Alert",
        `**Researcher:** ${payload.researcherName}\n**Workload:** ${payload.hours}/${payload.capacity}h\n**Week:** ${payload.week}`,
        urgencyColors.urgent
      );
    case 'task_assigned':
      return getEmbed(
        "New Task Assignment",
        `**Task:** ${payload.taskName}\n**Project:** ${payload.projectName}\n**Due:** ${payload.dueDate}\n**Assigner:** ${payload.assignerName}`,
        urgencyColors.info
      );
    case 'task_status_changed':
      return getEmbed(
        "Task Status Update",
        `**Task:** ${payload.taskName}\n**Change:** ${payload.oldStatus} → ${payload.newStatus}\n**User:** ${payload.changedBy}`,
        urgencyColors.info
      );
    case 'milestone_approaching':
      return getEmbed(
        "Milestone Threshold Alert",
        `**Milestone:** ${payload.milestoneName}\n**Project:** ${payload.projectName}\n**T-Minus:** ${payload.daysRemaining} days`,
        urgencyColors.info
      );
    case 'document_published':
      return getEmbed(
        "Protocol Released",
        `**Protocol:** ${payload.documentName}\n**Project:** ${payload.projectName}\n**Curator:** ${payload.publishedBy}`,
        urgencyColors.success
      );
    case 'stakeholder_feedback_received':
      return getEmbed(
        "External Stakeholder Feedback",
        `**Stakeholder:** ${payload.stakeholderName}\n**Protocol:** ${payload.documentName}\n**Excerpt:** "${payload.feedback.substring(0, 100)}..."`,
        urgencyColors.info
      );
    case 'daily_digest':
      return getEmbed(
        "Daily Synapse Summary",
        `Integrated summary of laboratory operations for today.`,
        urgencyColors.info,
        [
          { name: "Tasks Updated", value: String(payload.tasksUpdated), inline: true },
          { name: "Approvals Pending", value: String(payload.approvalsPending), inline: true },
          { name: "Milestones Due", value: String(payload.milestonesThisWeek), inline: true }
        ]
      );
    default:
      return { content: `Clinical Event: ${type}` };
  }
}
