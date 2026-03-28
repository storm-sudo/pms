import { Task, Project, User } from './types';
import { toast } from 'sonner';
import { supabaseService } from './supabase-service';

export type NotificationEventType = 
  | 'approval_request_received'
  | 'approval_resolved'
  | 'researcher_overload'
  | 'stakeholder_feedback_received'
  | 'task_status_changed'
  | 'document_published'
  | 'milestone_approaching'
  | 'phase_starting_soon'
  | 'daily_digest'
  | 'account_registered'
  | 'account_approved'
  | 'account_created';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

class NotificationService {
  private sender = 'Synapse@nucleovir.com';

  /**
   * Unified entry point for all laboratory notifications.
   * Performs preference checks and deduplication (1-hour window).
   */
  async sendNotification(
    eventType: NotificationEventType,
    recipientId: string,
    payload: {
      subject?: string;
      body?: string;
      html?: string;
      entityId?: string;
      entityType?: string;
      data?: any;
    }
  ) {
    try {
      // 1. Fetch recipient profile
      const users = await supabaseService.getProfiles();
      const recipient = users.find(u => u.id === recipientId);
      if (!recipient) return;

      // 2. Check notification preferences
      const prefs = await supabaseService.getNotificationPreferences(recipientId);
      const pref = prefs.find(p => p.eventType === eventType);
      
      // If preference exists and is disabled, skip
      if (pref && !pref.enabled) return;

      // 3. Deduplication check (1-hour window for same entity + event)
      if (payload.entityId) {
        const isDuplicate = await supabaseService.checkDuplicateNotification(recipientId, eventType, payload.entityId, 1);
        if (isDuplicate) {
          console.log(`[DEDUPLICATION] Skipping duplicate ${eventType} for entity ${payload.entityId}`);
          return;
        }
      }

      // 4. Determine delivery mode (instant vs digest)
      // Instant events are explicitly listed by the user
      const instantEvents: NotificationEventType[] = [
        'approval_request_received',
        'approval_resolved',
        'researcher_overload',
        'stakeholder_feedback_received',
        'account_registered',
        'account_approved',
        'account_created'
      ];

      const deliveryMode = instantEvents.includes(eventType) ? 'instant' : 'digest';

      // 5. Build content using templates if not provided
      let { subject, html, body } = payload;
      if (!subject || !html) {
        const template = this.getTemplate(eventType, payload.data, recipient);
        subject = subject || template.subject;
        html = html || template.html;
        body = body || template.text;
      }

      // 6. Action: Send immediately if instant, or just log if digest
      // Note: The Edge Function will query the log to send digests later.
      if (deliveryMode === 'instant') {
        await this.dispatchEmail(recipient.email, subject!, body!, html!);
      }

      // 7. Log the notification
      await supabaseService.logNotification(
        recipientId,
        eventType,
        payload.entityType,
        payload.entityId,
        subject!,
        deliveryMode
      );

    } catch (error) {
      console.error(`Failed to send ${eventType} notification:`, error);
    }
  }

  private async dispatchEmail(to: string, subject: string, body: string, html: string) {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          html: html || `<p>${body.replace(/\n/g, '<br>')}</p>`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      console.log(`%c[EMAIL DISPATCHED] To: ${to} Subject: ${subject}`, 'color: #10b981; font-weight: bold;');
    } catch (error: any) {
      console.error('Email Dispatch Error:', error);
      toast.error(`Notification Failure: ${error.message}`);
    }
  }

  private getTemplate(eventType: NotificationEventType, data: any, recipient: User): { subject: string, html: string, text: string } {
    const firstName = recipient.name.split(' ')[0];
    let title = '';
    let content = '';
    let ctaText = 'View in Synapse';
    let ctaUrl = `${window.location.origin}/`;
    let subject = `SYNAPSE: ${eventType.replace(/_/g, ' ').toUpperCase()}`;

    switch (eventType) {
      case 'approval_request_received':
        title = 'Approval Required';
        content = `Dear <span class="highlight">${firstName}</span>,<br><br>
                   A new approval request for "${data.title}" requires your laboratory review.<br><br>
                   <b>Project:</b> ${data.projectName}<br>
                   <b>Requested By:</b> ${data.requesterName}`;
        ctaText = 'Review Request';
        ctaUrl = `${window.location.origin}/workflow`;
        subject = `SYNAPSE: Approval Required - ${data.title}`;
        break;

      case 'approval_resolved':
        title = 'Approval Resolved';
        content = `Dear <span class="highlight">${firstName}</span>,<br><br>
                   Your request for "${data.title}" has been <b class="highlight">${data.status.toUpperCase()}</b> by ${data.approverName}.<br><br>
                   ${data.comment ? `<b>Supervisor Note:</b> ${data.comment}` : ''}`;
        ctaText = 'View Details';
        ctaUrl = `${window.location.origin}/tasks`;
        subject = `SYNAPSE: Request ${data.status.toUpperCase()} - ${data.title}`;
        break;

      case 'researcher_overload':
        title = 'Capacity Overload Alert';
        content = `Leadership Alert,<br><br>
                   Researcher <span class="highlight">${data.userName}</span> has exceeded their defined weekly capacity (${data.percentage}%).<br><br>
                   Please review laboratory throughput in the control center.`;
        ctaText = 'Rebalance Workload';
        ctaUrl = `${window.location.origin}/admin/tasks`;
        subject = `CRITICAL: Capacity Overload - ${data.userName}`;
        break;

      case 'stakeholder_feedback_received':
        title = 'Stakeholder Engagement';
        content = `Laboratory Update,<br><br>
                   New feedback has been posted by a stakeholder on the clinical report: <span class="highlight">${data.reportName}</span>.<br><br>
                   <b>Comment:</b> "${data.comment}"`;
        ctaText = 'Review Feedback';
        ctaUrl = `${window.location.origin}/projects/${data.projectId}/documents`;
        subject = `SYNAPSE: Stakeholder Feedback Received`;
        break;

      case 'document_published':
        title = 'Research Publication';
        content = `Dear Collaborator,<br><br>
                   A new clinical report or research document has been published in the portal: <span class="highlight">${data.docName}</span>.<br><br>
                   <b>Project:</b> ${data.projectName}`;
        ctaText = 'View in Portal';
        ctaUrl = `${window.location.origin}/portal/reports`;
        subject = `SYNAPSE: New Publication Released - ${data.projectName}`;
        break;

      case 'account_approved':
        title = 'Account Approved';
        content = `Dear <span class="highlight">${firstName}</span>,<br><br>
                   Your account has been approved. You can now log in to the Synapse Laboratory Portal.`;
        ctaText = 'Login to Portal';
        subject = `SYNAPSE: Account Approved`;
        break;

      case 'account_created':
        title = 'Account Created';
        content = `Dear <span class="highlight">${firstName}</span>,<br><br>
                   An account has been created for you by an administrator.<br><br>
                   <b>Initial Password:</b> ${data.password || 'dmin123'}`;
        ctaText = 'Get Started';
        subject = `SYNAPSE: Account Created`;
        break;

      default:
        title = 'Laboratory Update';
        content = `Hello ${firstName}, there is a new update waiting for you in the Synapse platform.`;
    }

    return {
      subject,
      text: content.replace(/<[^>]*>?/gm, ''),
      html: this.getHtmlTemplate(title, content, ctaText, ctaUrl)
    };
  }

  private getHtmlTemplate(title: string, content: string, ctaText: string, ctaUrl: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
            .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
            .logo { font-size: 24px; font-weight: bold; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.1em; }
            .subheader { font-size: 12px; color: #64748b; margin-top: 4px; }
            .content { padding: 30px 0; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; padding-top: 20px; border-top: 1px solid #e2e8f0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
            .highlight { color: #2563eb; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SYNAPSE</div>
              <div class="subheader">NUCLEOVIR THERAPEUTICS</div>
            </div>
            <div class="content">
              <h2 style="margin-top: 0; font-size: 20px;">${title}</h2>
              <p>${content}</p>
              <a href="${ctaUrl}" class="button">${ctaText}</a>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} NucleoVir Therapeutics. All rights reserved.<br>
              This is an automated message from Synapse PM.
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const notificationService = new NotificationService();
