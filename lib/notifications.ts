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

  sendEmail(to: string, subject: string, body: string) {
    const notification: EmailNotification = {
      to,
      subject,
      body,
      sentAt: new Date().toISOString(),
    };

    // In a real app, this would call an API
    console.log(`%c[EMAIL SENT] From: ${this.sender}`, 'color: #0ea5e9; font-weight: bold;');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    // For demo purposes, we can show a toast
    toast(`Email Sent to ${to}`, {
      description: subject,
    });

    // Store in localStorage for a "Sent Emails" log if needed
    const logs = JSON.parse(localStorage.getItem('email_logs') || '[]');
    logs.push(notification);
    localStorage.setItem('email_logs', JSON.stringify(logs.slice(-50))); // Keep last 50
  }

  notifyTaskAssignment(task: Task, project: Project, assignees: User[], manager: User) {
    assignees.forEach(assignee => {
      const firstName = assignee.name.split(' ')[0];
      const subject = `SYNAPSE: new task assigned`;
      const body = `Dear ${firstName}, 

you have been assigned a new task "${task.title}" in project "${project.name}" by ${manager.name}, due date is ${task.dueDate || 'not set'}.

Click here to see: ${window.location.origin}/tasks`;

      this.sendEmail(assignee.email, subject, body);
    });
  }

  notifyTaskOverdue(task: Task, project: Project, assignees: User[]) {
    assignees.forEach(assignee => {
      const firstName = assignee.name.split(' ')[0];
      const subject = `SYNAPSE: task overdue`;
      const body = `Dear ${firstName}, 

your task "${task.title}" in project "${project.name}" is OVERDUE. The original due date was ${task.dueDate}.

Click here to see: ${window.location.origin}/tasks`;

      this.sendEmail(assignee.email, subject, body);
    });
  }

  checkAndSendReports(tasks: Task[], projects: Project[], users: User[]) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0-6, 6 is Saturday
    
    const lastDaily = localStorage.getItem('last_daily_report');
    const lastWeekly = localStorage.getItem('last_weekly_report');
    
    const todayStr = now.toISOString().split('T')[0];
    
    // Daily Report: 5 PM (17:00)
    if (currentHour >= 17 && lastDaily !== todayStr) {
      this.sendDailyReport(tasks, projects, users);
      localStorage.setItem('last_daily_report', todayStr);
    }
    
    // Weekly Report: Saturday (6) 5 PM (17:00)
    if (currentDay === 6 && currentHour >= 17 && lastWeekly !== todayStr) {
       this.sendWeeklyReport(tasks, projects, users);
       localStorage.setItem('last_weekly_report', todayStr);
    }
  }

  private sendDailyReport(tasks: Task[], projects: Project[], users: User[]) {
    users.forEach(user => {
      const myTasks = tasks.filter(t => t.assigneeIds.includes(user.id) && t.status !== 'done');
      if (myTasks.length === 0) return;

      const subject = `SYNAPSE: Daily Activity Report`;
      const body = `Dear ${user.name.split(' ')[0]},
      
Here is your daily summary for ${new Date().toLocaleDateString()}:
You have ${myTasks.length} active tasks.
${myTasks.slice(0, 5).map(t => `- ${t.title} (Priority: ${t.priority})`).join('\n')}

Good luck with your research!`;

      this.sendEmail(user.email, subject, body);
    });
  }

  private sendWeeklyReport(tasks: Task[], projects: Project[], users: User[]) {
     users.forEach(user => {
      const completedThisWeek = tasks.filter(t => 
        t.assigneeIds.includes(user.id) && 
        t.status === 'done'
      ).length;

      const subject = `SYNAPSE: Weekly Progress Report`;
      const body = `Dear ${user.name.split(' ')[0]},
      
Well done on finishing the week!
You completed ${completedThisWeek} tasks this week.

Rest well and see you on Monday!`;

      this.sendEmail(user.email, subject, body);
    });
  }
}

export const notificationService = new NotificationService();
