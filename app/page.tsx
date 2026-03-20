'use client';

import { useIsAdmin, useCurrentUser, useMyTasks } from '@/lib/store';
import { AlertBanner } from '@/components/dashboard/alert-banner';
import { PriorityActionsPanel } from '@/components/dashboard/priority-actions';
import { AtRiskProjects } from '@/components/dashboard/at-risk-projects';
import { TeamWorkload } from '@/components/dashboard/team-workload';
import { UnassignedTasks } from '@/components/dashboard/unassigned-tasks';
import { StatsOverview } from '@/components/dashboard/stats-overview';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ListTodo,
  ArrowRight,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { priorityColors, statusColors } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-muted-foreground">Real-time overview of team progress and priorities</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>

      <AlertBanner />
      
      <StatsOverview />
      
      <PriorityActionsPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <AtRiskProjects />
        <UnassignedTasks />
      </div>

      <TeamWorkload />
    </div>
  );
}

function MemberDashboard() {
  const currentUser = useCurrentUser();
  const myTasks = useMyTasks();
  
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = myTasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < today);
  const dueTodayTasks = myTasks.filter(t => t.status !== 'done' && t.dueDate === today);
  const inProgressTasks = myTasks.filter(t => t.status === 'in-progress');
  const completedTasks = myTasks.filter(t => t.status === 'done');
  const todoTasks = myTasks.filter(t => t.status === 'todo');

  const completionRate = myTasks.length > 0 
    ? Math.round((completedTasks.length / myTasks.length) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Work</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser.name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <ListTodo className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todoTasks.length + inProgressTasks.length}</p>
                <p className="text-xs text-muted-foreground">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={overdueTasks.length > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                overdueTasks.length > 0 ? 'bg-destructive/10' : 'bg-muted'
              )}>
                <Clock className={cn(
                  'h-5 w-5',
                  overdueTasks.length > 0 ? 'text-destructive' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap userId={currentUser.id} />
        </CardContent>
      </Card>

      {/* My Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Due Today */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Due Today
              </CardTitle>
              <Badge className="bg-warning text-warning-foreground">
                {dueTodayTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {dueTodayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tasks due today
              </p>
            ) : (
              <div className="space-y-2">
                {dueTodayTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                In Progress
              </CardTitle>
              <Badge variant="secondary">{inProgressTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tasks in progress
              </p>
            ) : (
              <div className="space-y-2">
                {inProgressTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.subtasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                          <Progress 
                            value={(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}
                            className="h-1 flex-1"
                          />
                          <span className="text-xs text-muted-foreground">
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Link href="/tasks">
              <Button variant="ghost" className="w-full mt-4 group">
                View All My Tasks
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const isAdmin = useIsAdmin();
  
  return isAdmin ? <AdminDashboard /> : <MemberDashboard />;
}
