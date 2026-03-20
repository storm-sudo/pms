'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  Filter,
  SortAsc,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useApp, useMyTasks, useCurrentUser, useProject } from '@/lib/store';
import { priorityColors, statusColors } from '@/lib/mock-data';
import { Task, Priority, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ActivityHeatmap } from '@/components/activity-heatmap';

function TaskCard({ task }: { task: Task }) {
  const project = useProject(task.projectId);
  const { setSelectedTaskId, updateTask } = useApp();
  
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'done';

  const statusIcon = {
    'todo': <Circle className="h-5 w-5 text-muted-foreground" />,
    'in-progress': <Clock className="h-5 w-5 text-blue-500" />,
    'blocked': <AlertTriangle className="h-5 w-5 text-destructive" />,
    'review': <Clock className="h-5 w-5 text-purple-500" />,
    'done': <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  };

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'done') {
      updateTask(task.id, { status: 'todo', completedDate: undefined });
    } else {
      updateTask(task.id, { status: 'done', completedDate: new Date().toISOString().split('T')[0] });
    }
  };

  return (
    <div 
      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={() => setSelectedTaskId(task.id)}
    >
      <button onClick={toggleStatus} className="mt-0.5 shrink-0">
        {statusIcon[task.status]}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={cn(
              'font-medium',
              task.status === 'done' && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">{project?.name}</p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          </div>
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          {task.dueDate && (
            <span className={cn(
              'flex items-center gap-1',
              isOverdue && 'text-destructive font-medium'
            )}>
              <Calendar className="h-3.5 w-3.5" />
              {new Date(task.dueDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
              {isOverdue && ' (Overdue)'}
            </span>
          )}
          
          {task.subtasks.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
            </span>
          )}
          
          {task.status === 'blocked' && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Blocked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const currentUser = useCurrentUser();
  const myTasks = useMyTasks();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status'>('dueDate');

  const today = new Date().toISOString().split('T')[0];

  const filterTasks = (tasks: Task[]) => {
    return tasks
      .filter(t => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'priority') {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return order[a.priority] - order[b.priority];
        }
        if (sortBy === 'status') {
          const order = { blocked: 0, 'in-progress': 1, todo: 2, review: 3, done: 4 };
          return order[a.status] - order[b.status];
        }
        return 0;
      });
  };

  const activeTasks = filterTasks(myTasks.filter(t => t.status !== 'done'));
  const completedTasks = filterTasks(myTasks.filter(t => t.status === 'done'));
  const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < today);
  const dueTodayTasks = activeTasks.filter(t => t.dueDate === today);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground">
            {activeTasks.length} active tasks, {completedTasks.length} completed
          </p>
        </div>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap userId={currentUser.id} compact />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Priority: {priorityFilter === 'all' ? 'All' : priorityFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPriorityFilter('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('critical')}>Critical</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('high')}>High</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>Medium</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter('low')}>Low</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SortAsc className="h-4 w-4 mr-2" />
              Sort by: {sortBy === 'dueDate' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : 'Status'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('dueDate')}>Due Date</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('priority')}>Priority</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('status')}>Status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Stats */}
      {(overdueTasks.length > 0 || dueTodayTasks.length > 0) && (
        <div className="flex gap-4">
          {overdueTasks.length > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">{overdueTasks.length} overdue</span>
                </div>
              </CardContent>
            </Card>
          )}
          {dueTodayTasks.length > 0 && (
            <Card className="border-warning/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-warning">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{dueTodayTasks.length} due today</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tasks */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">{activeTasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3">
          {activeTasks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No active tasks</p>
            </div>
          ) : (
            activeTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {completedTasks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No completed tasks</p>
            </div>
          ) : (
            completedTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
