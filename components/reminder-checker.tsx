'use client';

import { useEffect } from 'react';
import { useApp } from '@/lib/store';

export function ReminderChecker() {
    const { tasks, projects, users, isLoggedIn } = useApp();

    useEffect(() => {
        if (!isLoggedIn || tasks.length === 0 || projects.length === 0 || users.length === 0) return;

        const lastCheckDate = localStorage.getItem('synapse-last-reminder-check');
        const today = new Date().toISOString().split('T')[0];

        // Only run check once per day to prevent spam
        if (lastCheckDate === today) {
            console.log('[Reminders] Already checked for today.');
            return;
        }

        const checkAndSendReminders = async () => {
            console.log('[Reminders] Running daily check...');
            let emailsSentCount = 0;

            for (const task of tasks) {
                if (task.status === 'done' || !task.dueDate) continue;

                const isOverdue = task.dueDate < today;
                const isDueToday = task.dueDate === today;

                if (!isOverdue && !isDueToday) continue;

                const project = projects.find(p => p.id === task.projectId);
                const supervisor = project ? users.find(u => u.id === project.leadId) : null;

                for (const userId of task.assigneeIds) {
                    const assignee = users.find(u => u.id === userId);
                    if (!assignee) continue;

                    const emailData = {
                        taskTitle: task.title,
                        dueDate: task.dueDate,
                        assigneeEmail: assignee.email,
                        assigneeName: assignee.name,
                        supervisorEmail: supervisor?.email || '',
                        supervisorName: supervisor?.name || '',
                        type: isOverdue ? 'overdue' : 'due-date'
                    };

                    try {
                        const res = await fetch('/api/notify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(emailData)
                        });
                        const result = await res.json();
                        if (result.success) {
                            emailsSentCount++;
                        }
                    } catch (error) {
                        console.error(`[Reminders] Failed to send email for task: ${task.title} to ${assignee.name}`, error);
                    }
                }
            }

            console.log(`[Reminders] Finished check. Triggered ${emailsSentCount} email notifications.`);
            localStorage.setItem('synapse-last-reminder-check', today);
        };

        checkAndSendReminders();
    }, [tasks, projects, users, isLoggedIn]);

    return null;
}
