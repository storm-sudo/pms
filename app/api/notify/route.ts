import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
    try {
        const {
            taskTitle,
            dueDate,
            assigneeEmail,
            assigneeName,
            supervisorEmail,
            supervisorName,
            type // 'due-date' | 'overdue'
        } = await request.json();

        if (!assigneeEmail || !taskTitle) {
            return NextResponse.json({ error: 'Missing required task or recipient details' }, { status: 400 });
        }

        const isOverdue = type === 'overdue';
        const subject = isOverdue
            ? `🚨 OVERDUE REMINDER: ${taskTitle}`
            : `📅 Task Due Today: ${taskTitle}`;

        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-top: 4px solid ${isOverdue ? '#ef4444' : '#3b82f6'}; border-radius: 8px; padding: 24px; color: #1f2937;">
        <h2 style="color: ${isOverdue ? '#ef4444' : '#3b82f6'}; margin-top: 0;">${isOverdue ? 'Overdue Task Alert' : 'Task Due Notification'}</h2>
        <p>Hi <strong>${assigneeName}</strong>,</p>
        <p>This is an automated notification regarding your task in <strong>Synapse</strong>.</p>
        
        <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <div style="margin-bottom: 8px;"><strong>Task:</strong> ${taskTitle}</div>
          <div style="margin-bottom: 8px;"><strong>Due Date:</strong> ${dueDate}</div>
          <div><strong>Status:</strong> <span style="color: ${isOverdue ? '#b91c1c' : '#1e3a8a'}; font-weight: 600;">${isOverdue ? 'Overdue' : 'Due Today'}</span></div>
        </div>

        ${isOverdue ? '<p style="color: #b91c1c; font-weight: 500;">Please update the status or complete this task as soon as possible. Daily reminders will be sent until completion.</p>' : '<p>Please ensure this task is completed by the end of today.</p>'}

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        
        <div style="font-size: 13px; color: #6b7280;">
          <p style="margin-bottom: 4px;"><strong>Supervisor:</strong> ${supervisorName || 'Not Assigned'} (${supervisorEmail || 'N/A'})</p>
          <p>You are receiving this because you are assigned to this task or are supervising the project. Do not reply directly to this email.</p>
        </div>
      </div>
    `;

        const recipients = [assigneeEmail];
        if (supervisorEmail && supervisorEmail !== assigneeEmail) {
            recipients.push(supervisorEmail);
        }

        if (!resend) {
            console.log(`[Email Dry-Run] Email to: ${recipients.join(', ')}`);
            console.log(`[Email Dry-Run] Subject: ${subject}`);
            return NextResponse.json({
                success: true,
                dryRun: true,
                message: 'Resend API key is missing. Simulation logged successfully.'
            });
        }

        const { data, error } = await resend.emails.send({
            from: 'Synapse Notifications <onboarding@resend.dev>', // Resend verified domain or default testing
            to: recipients,
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
