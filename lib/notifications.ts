import { Task, Project, User } from './types';
import { toast } from 'sonner';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

class NotificationService {
  private sender = 'Synapse@nucleovir.com';

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

  async sendEmail(to: string, subject: string, body: string, html?: string) {
    const notification: EmailNotification = {
      to,
      subject,
      body,
      sentAt: new Date().toISOString(),
    };

    // Production: Call server-side API
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
        throw new Error('Failed to send email');
      }

      console.log(`%c[EMAIL SENT] To: ${to} Subject: ${subject}`, 'color: #10b981; font-weight: bold;');
    } catch (error) {
      console.error('Notification Error:', error);
      // Fallback for development/offline
      toast.error(`Failed to send email to ${to}`);
    }

    // For demo/transparency, log to localStorage
    const logs = JSON.parse(localStorage.getItem('email_logs') || '[]');
    logs.push(notification);
    localStorage.setItem('email_logs', JSON.stringify(logs.slice(-50)));
  }

  notifyTaskAssignment(task: Task, project: Project, assignees: User[], manager: User) {
    assignees.forEach(assignee => {
      const firstName = assignee.name.split(' ')[0];
      const subject = `SYNAPSE: New Task Assigned - ${task.priority.toUpperCase()} Priority`;
      const content = `Dear <span class="highlight">${firstName}</span>,<br><br>
                       You have been assigned a <b>new task</b> "${task.title}" in project <span class="highlight">${project.name}</span> by ${manager.name}.<br><br>
                       <b>Due Date:</b> ${task.dueDate || 'Not set'}<br>
                       <b>Priority:</b> ${task.priority.toUpperCase()}`;
      
      const textBody = `Dear ${firstName}, you have been assigned a new task "${task.title}" in project "${project.name}" by ${manager.name}. Due date: ${task.dueDate || 'Not set'}.`;
      const html = this.getHtmlTemplate('New Task Assignment', content, 'View Task Details', `${window.location.origin}/tasks`);

      this.sendEmail(assignee.email, subject, textBody, html);
    });
  }

  notifyTaskOverdue(task: Task, project: Project, assignees: User[]) {
    assignees.forEach(assignee => {
      const firstName = assignee.name.split(' ')[0];
      const subject = `SYNAPSE: Task OVERDUE - ${task.title}`;
      const content = `Dear <span class="highlight">${firstName}</span>,<br><br>
                       The task "${task.title}" in project <span class="highlight">${project.name}</span> is now <b style="color: #ef4444;">OVERDUE</b>.<br><br>
                       <b>Original Due Date:</b> ${task.dueDate}<br>
                       Please update the status or request an extension.`;

      const textBody = `Dear ${firstName}, your task "${task.title}" in project "${project.name}" is OVERDUE.`;
      const html = this.getHtmlTemplate('Task Overdue Alert', content, 'Update Task Status', `${window.location.origin}/tasks`);

      this.sendEmail(assignee.email, subject, textBody, html);
    });
  }

  notifyTaskDueSoon(task: Task, project: Project, assignees: User[]) {
    assignees.forEach(assignee => {
      const firstName = assignee.name.split(' ')[0];
      const subject = `SYNAPSE: Task Due Soon - ${task.title}`;
      const content = `Dear <span class="highlight">${firstName}</span>,<br><br>
                       This is a reminder that your task "${task.title}" in project <span class="highlight">${project.name}</span> is due within <b class="highlight">24 hours</b>.<br><br>
                       <b>Due Date:</b> ${task.dueDate}`;

      const textBody = `Dear ${firstName}, your task "${task.title}" in project "${project.name}" is due within 24 hours.`;
      const html = this.getHtmlTemplate('Task Deadline Reminder', content, 'Review Task', `${window.location.origin}/tasks`);

      this.sendEmail(assignee.email, subject, textBody, html);
    });
  }

  checkAndSendReports(tasks: Task[], projects: Project[], users: User[]) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); 
    const todayStr = now.toISOString().split('T')[0];
    
    // Check for "Due Soon" tasks (due tomorrow)
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    tasks.forEach(task => {
      if (task.status !== 'done' && task.dueDate === tomorrowStr) {
        const lastReminded = localStorage.getItem(`reminded_soon_${task.id}`);
        if (lastReminded !== todayStr) {
          const project = projects.find(p => p.id === task.projectId);
          const assignees = users.filter(u => task.assigneeIds.includes(u.id));
          if (project && assignees.length > 0) {
            this.notifyTaskDueSoon(task, project, assignees);
            localStorage.setItem(`reminded_soon_${task.id}`, todayStr);
          }
        }
      }
    });

    // Check for "Overdue" tasks
    tasks.forEach(task => {
      if (task.status !== 'done' && task.dueDate && task.dueDate < todayStr) {
        const lastReminded = localStorage.getItem(`reminded_overdue_${task.id}`);
        if (lastReminded !== todayStr) {
          const project = projects.find(p => p.id === task.projectId);
          const assignees = users.filter(u => task.assigneeIds.includes(u.id));
          if (project && assignees.length > 0) {
            this.notifyTaskOverdue(task, project, assignees);
            localStorage.setItem(`reminded_overdue_${task.id}`, todayStr);
          }
        }
      }
    });
    
    // Daily Report: 5 PM
    const lastDaily = localStorage.getItem('last_daily_report');
    if (currentHour >= 17 && lastDaily !== todayStr) {
      this.sendDailyReport(tasks, projects, users);
      localStorage.setItem('last_daily_report', todayStr);
    }
    
    // Weekly Report: Saturday 5 PM
    const lastWeekly = localStorage.getItem('last_weekly_report');
    if (currentDay === 6 && currentHour >= 17 && lastWeekly !== todayStr) {
       this.sendWeeklyReport(tasks, projects, users);
       localStorage.setItem('last_weekly_report', todayStr);
    }
  }

  private sendDailyReport(tasks: Task[], projects: Project[], users: User[]) {
    users.forEach(user => {
      const myTasks = tasks.filter(t => t.assigneeIds.includes(user.id) && t.status !== 'done');
      if (myTasks.length === 0) return;

      const subject = `SYNAPSE: Daily Activity Summary`;
      const content = `Dear <span class="highlight">${user.name.split(' ')[0]}</span>,<br><br>
                       Here is your daily summary for ${new Date().toLocaleDateString()}:<br>
                       You have <b class="highlight">${myTasks.length} active tasks</b>.<br><br>
                       ${myTasks.slice(0, 5).map(t => `&bull; ${t.title} (<span style="color: #64748b;">${t.priority}</span>)`).join('<br>')}`;

      const textBody = `Dear ${user.name.split(' ')[0]}, you have ${myTasks.length} active tasks.`;
      const html = this.getHtmlTemplate('Daily Activity Summary', content, 'Go to Dashboard', `${window.location.origin}/`);

      this.sendEmail(user.email, subject, textBody, html);
    });
  }

  private sendWeeklyReport(tasks: Task[], projects: Project[], users: User[]) {
     users.forEach(user => {
      const completedThisWeek = tasks.filter(t => 
        t.assigneeIds.includes(user.id) && 
        t.status === 'done'
      ).length;

      const subject = `SYNAPSE: Weekly Science Progress Report`;
      const content = `Dear <span class="highlight">${user.name.split(' ')[0]}</span>,<br><br>
                       Excellent work this week! You have successfully completed <b class="highlight">${completedThisWeek} tasks</b>.<br><br>
                       Rest well and we look forward to more breakthroughs on Monday.`;

      const textBody = `Dear ${user.name.split(' ')[0]}, you completed ${completedThisWeek} tasks this week.`;
      const html = this.getHtmlTemplate('Weekly Progress Report', content, 'View My Accomplishments', `${window.location.origin}/tasks`);

      this.sendEmail(user.email, subject, textBody, html);
    });
  }
}

export const notificationService = new NotificationService();
