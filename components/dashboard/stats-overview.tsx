'use client';

import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Target, 
  TrendingUp,
  Layers
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardStats, useProjects, useTasks } from '@/lib/store';
import { cn } from '@/lib/utils';

export function StatsOverview() {
  const stats = useDashboardStats();
  const projects = useProjects();
  const tasks = useTasks();
  
  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'at-risk').length;

  // Compute average completion time from actual data
  const completedWithDates = tasks.filter(t => t.status === 'done' && t.completedDate && t.createdAt);
  const avgCompletionDays = completedWithDates.length > 0
    ? (completedWithDates.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedDate!).getTime();
        return sum + (completed - created) / (1000 * 60 * 60 * 24);
      }, 0) / completedWithDates.length).toFixed(1)
    : '—';

  // Compute completion rate trend (this week vs last week)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const completedThisWeek = tasks.filter(t => t.completedDate && new Date(t.completedDate) >= weekAgo).length;
  const completedLastWeek = tasks.filter(t => t.completedDate && new Date(t.completedDate) >= twoWeeksAgo && new Date(t.completedDate) < weekAgo).length;
  const trend = completedLastWeek > 0
    ? Math.round(((completedThisWeek - completedLastWeek) / completedLastWeek) * 100)
    : 0;

  const cards = [
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      subtitle: `${stats.completedTasks} of ${stats.totalTasks} tasks`,
      icon: Target,
      color: 'text-primary bg-primary/10',
      trend: trend !== 0 ? `${trend > 0 ? '+' : ''}${trend}%` : undefined,
      trendUp: trend >= 0,
    },
    {
      title: 'Active Projects',
      value: activeProjects,
      subtitle: `${projects.length} total projects`,
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Blocked Tasks',
      value: stats.blockedTasks.length,
      subtitle: 'Require attention',
      icon: AlertTriangle,
      color: stats.blockedTasks.length > 0 ? 'text-destructive bg-destructive/10' : 'text-muted-foreground bg-muted',
    },
    {
      title: 'Avg Completion',
      value: `${avgCompletionDays}d`,
      subtitle: 'Task completion time',
      icon: Clock,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={idx}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.trend && (
                    <span className={cn(
                      'text-xs font-medium flex items-center',
                      card.trendUp ? 'text-emerald-500' : 'text-destructive'
                    )}>
                      <TrendingUp className={cn('h-3 w-3 mr-0.5', !card.trendUp && 'rotate-180')} />
                      {card.trend}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </div>
              <div className={cn('p-2 rounded-lg', card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
