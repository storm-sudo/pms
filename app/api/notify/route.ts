import { NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications';
import { supabaseService } from '@/lib/supabase-service';

export async function POST(request: Request) {
    try {
        const {
            taskId,
            assigneeId,
            type // 'due-date' | 'overdue'
        } = await request.json();

        if (!assigneeId || !taskId) {
            return NextResponse.json({ error: 'Missing required task or recipient details' }, { status: 400 });
        }

        // Fetch task and project info for the template
        const task = await supabaseService.getTasks().then(tasks => tasks.find(t => t.id === taskId));
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const project = await supabaseService.getProjects().then(projects => projects.find(p => p.id === task.projectId));

        await notificationService.sendNotification('task_status_changed', assigneeId, {
            entityId: taskId,
            entityType: 'task',
            data: {
                title: task.title,
                projectName: project?.name || 'Laboratory Project',
                status: type === 'overdue' ? 'overdue' : 'due today'
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
