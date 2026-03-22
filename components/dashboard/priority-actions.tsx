'use client';

import { Clock, AlertCircle, Zap, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDashboardStats, useApp, useUser } from '@/lib/store';
import { priorityColors } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';
import Link from 'next/link';

function TaskRow({ task, onAssign }: { task: Task; onAssign: () => void }) {
  const assignee = useUser(task.assigneeId);
  const { setSelectedTaskId } = useApp();
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const daysOverdue = task.dueDate 
    ? Math.floor((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
      onClick={() => setSelectedTaskId(task.id)}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
            {task.priority}
          </Badge>
          {daysOverdue > 0 && (
            <span className="text-xs text-destructive font-medium">
              {daysOverdue}d overdue
            </span>
          )}
        </div>
      </div>
      {assignee ? (
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-[10px] bg-secondary">
            {getInitials(assignee.name)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onAssign();
          }}
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Assign
        </Button>
      )}
    </div>
  );
}

export function PriorityActionsPanel() {
  const stats = useDashboardStats();
  const { setSelectedTaskId } = useApp();

  return (
    <div id="priority-actions" className="grid gap-4 md:grid-cols-3">
      {/* Overdue */}
      <Card className={cn(
        "border-l-4",
        stats.overdueTasks.length > 0 ? "border-l-destructive" : "border-l-muted"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-destructive" />
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Badge variant="destructive" className="ml-auto">
              {stats.overdueTasks.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.overdueTasks.slice(0, 3).map((task) => (
            <TaskRow 
              key={task.id} 
              task={task} 
              onAssign={() => setSelectedTaskId(task.id)}
            />
          ))}
          {stats.overdueTasks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No overdue tasks
            </p>
          )}
          {stats.overdueTasks.length > 3 && (
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="w-full">
                View all {stats.overdueTasks.length}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Due Today */}
      <Card className={cn(
        "border-l-4",
        stats.dueTodayTasks.length > 0 ? "border-l-warning" : "border-l-muted"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning" />
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Badge className="ml-auto bg-warning text-warning-foreground">
              {stats.dueTodayTasks.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.dueTodayTasks.slice(0, 3).map((task) => (
            <TaskRow 
              key={task.id} 
              task={task} 
              onAssign={() => setSelectedTaskId(task.id)}
            />
          ))}
          {stats.dueTodayTasks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tasks due today
            </p>
          )}
          {stats.dueTodayTasks.length > 3 && (
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="w-full">
                View all {stats.dueTodayTasks.length}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Critical */}
      <Card className={cn(
        "border-l-4",
        stats.criticalTasks.length > 0 ? "border-l-orange-500" : "border-l-muted"
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Badge className="ml-auto bg-orange-500 text-white">
              {stats.criticalTasks.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.criticalTasks.slice(0, 3).map((task) => (
            <TaskRow 
              key={task.id} 
              task={task} 
              onAssign={() => setSelectedTaskId(task.id)}
            />
          ))}
          {stats.criticalTasks.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No critical tasks
            </p>
          )}
          {stats.criticalTasks.length > 3 && (
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="w-full">
                View all {stats.criticalTasks.length}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
