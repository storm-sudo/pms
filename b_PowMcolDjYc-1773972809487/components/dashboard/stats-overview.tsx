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
import { useDashboardStats, useProjects } from '@/lib/store';
import { cn } from '@/lib/utils';

export function StatsOverview() {
  const stats = useDashboardStats();
  const projects = useProjects();
  
  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'at-risk').length;

  const cards = [
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      subtitle: `${stats.completedTasks} of ${stats.totalTasks} tasks`,
      icon: Target,
      color: 'text-primary bg-primary/10',
      trend: '+5%',
      trendUp: true,
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
      value: '2.4d',
      subtitle: 'Task completion time',
      icon: Clock,
      color: 'text-emerald-500 bg-emerald-500/10',
      trend: '-0.3d',
      trendUp: true,
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
