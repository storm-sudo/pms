'use client';

import Link from 'next/link';
import { AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useApp, useUser } from '@/lib/store';
import { departmentColors } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/types';

function AtRiskProjectRow({ project, getDaysRemaining, onSelect }: { project: Project; getDaysRemaining: (d: string | undefined) => number | null; onSelect: () => void }) {
  const lead = useUser(project.leadId);
  const daysRemaining = getDaysRemaining(project.dueDate);

  return (
    <div
      className="p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{project.name}</h4>
            <Badge variant="outline" className={cn('text-xs', departmentColors[project.department])}>
              {project.department}
            </Badge>
          </div>
          {lead && (
            <p className="text-sm text-muted-foreground mt-1">
              Lead: {lead.name}
            </p>
          )}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </div>
        <div className="text-right shrink-0">
          {daysRemaining !== null && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              daysRemaining < 0 ? "text-destructive" :
              daysRemaining <= 7 ? "text-warning" : "text-muted-foreground"
            )}>
              <Calendar className="h-4 w-4" />
              {daysRemaining < 0
                ? `${Math.abs(daysRemaining)}d overdue`
                : `${daysRemaining}d left`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AtRiskProjects() {
  const stats = useDashboardStats();
  const { setSelectedProjectId } = useApp();

  const getDaysRemaining = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>At-Risk Projects</CardTitle>
          </div>
          <Badge variant="destructive">{stats.atRiskProjects.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {stats.atRiskProjects.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">All projects are on track</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.atRiskProjects.map((project) => (
              <AtRiskProjectRow key={project.id} project={project} getDaysRemaining={getDaysRemaining} onSelect={() => setSelectedProjectId(project.id)} />
            ))}
          </div>
        )}
        {stats.atRiskProjects.length > 0 && (
          <Link href="/projects">
            <Button variant="ghost" className="w-full mt-4 group">
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
