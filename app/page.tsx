'use client';

import { useIsAdmin, useCurrentUser, useMyTasks, useApp } from '@/lib/store';
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
import { priorityColors } from '@/lib/mock-data';
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
  const { setSelectedTaskId } = useApp();
  
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
          <CardContent className="p-4 text-emerald-600">
            <div className="flex items-center gap-3 font-black">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl">{todoTasks.length + inProgressTasks.length}</p>
                <p className="text-xs uppercase tracking-widest opacity-60">Active Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={overdueTasks.length > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 font-black">
              <div className={cn(
                'p-2 rounded-lg text-emerald-600',
                overdueTasks.length > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted'
              )}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl">{overdueTasks.length}</p>
                <p className="text-xs uppercase tracking-widest opacity-60 text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 font-black">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl">{completedTasks.length}</p>
                <p className="text-xs uppercase tracking-widest opacity-60 text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 font-black">
              <div className="p-2 rounded-lg bg-primary/10 text-primary uppercase italic">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl">{completionRate}%</p>
                <p className="text-xs uppercase tracking-widest opacity-60 text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card className="border-2 shadow-xl shadow-blue-500/5">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest">Research Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap userId={currentUser.id} />
        </CardContent>
      </Card>

      {/* My Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Due Today */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Deadlines: Today
              </CardTitle>
              <Badge className="bg-amber-500 text-white font-black">
                {dueTodayTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {dueTodayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center italic font-medium">
                No research deadlines due today.
              </p>
            ) : (
              <div className="space-y-2">
                {dueTodayTasks.map((task) => (
                  <button 
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted border border-transparent hover:border-border transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate group-hover:text-blue-600 transition-colors uppercase italic">{task.title}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[9px] font-black uppercase tracking-widest', priorityColors[task.priority as keyof typeof priorityColors])}>
                      {task.priority}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                Active Exploration
              </CardTitle>
              <Badge variant="secondary" className="font-black">{inProgressTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center italic font-medium">
                No active exploration tasks.
              </p>
            ) : (
              <div className="space-y-2">
                {inProgressTasks.slice(0, 5).map((task) => (
                  <button 
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted border border-transparent hover:border-border transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate group-hover:text-blue-600 transition-colors uppercase italic">{task.title}</p>
                      {task.subtasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Progress 
                            value={(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}
                            className="h-1 flex-1 bg-blue-100"
                          />
                          <span className="text-[10px] font-black text-muted-foreground">
                            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={cn('text-[9px] font-black uppercase tracking-widest', priorityColors[task.priority as keyof typeof priorityColors])}>
                      {task.priority}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            <Link href="/tasks">
              <Button variant="ghost" className="w-full mt-4 group font-black uppercase text-[10px] tracking-widest">
                Explore Full Directory
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
