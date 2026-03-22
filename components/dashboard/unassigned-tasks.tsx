'use client';

import Link from 'next/link';
import { UserX, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useApp, useProject } from '@/lib/store';
import { priorityColors } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';

function UnassignedTaskRow({ task }: { task: Task }) {
  const project = useProject(task.projectId);
  const { setSelectedTaskId } = useApp();

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
      onClick={() => setSelectedTaskId(task.id)}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {project?.name}
        </p>
      </div>
      <Badge variant="outline" className={cn('text-xs shrink-0', priorityColors[task.priority])}>
        {task.priority}
      </Badge>
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 text-xs shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTaskId(task.id);
        }}
      >
        <UserPlus className="h-3 w-3 mr-1" />
        Assign
      </Button>
    </div>
  );
}

export function UnassignedTasks() {
  const stats = useDashboardStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Unassigned Tasks</CardTitle>
          </div>
          <Badge variant="secondary">{stats.unassignedTasks.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {stats.unassignedTasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">All tasks are assigned</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.unassignedTasks.slice(0, 5).map((task) => (
              <UnassignedTaskRow key={task.id} task={task} />
            ))}
            {stats.unassignedTasks.length > 5 && (
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  View all {stats.unassignedTasks.length} unassigned
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
