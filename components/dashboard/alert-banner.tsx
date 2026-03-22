'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/lib/store';

export function AlertBanner() {
  const [dismissed, setDismissed] = useState(false);
  const stats = useDashboardStats();
  
  const urgentCount = stats.overdueTasks.length + stats.criticalTasks.length;
  
  if (dismissed || urgentCount === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="pulse-alert absolute inset-0 rounded-lg border-2 border-destructive/20" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            Attention Required
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.overdueTasks.length > 0 && (
              <span className="text-destructive font-medium">
                {stats.overdueTasks.length} overdue task{stats.overdueTasks.length !== 1 ? 's' : ''}
              </span>
            )}
            {stats.overdueTasks.length > 0 && stats.criticalTasks.length > 0 && ' and '}
            {stats.criticalTasks.length > 0 && (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                {stats.criticalTasks.length} critical task{stats.criticalTasks.length !== 1 ? 's' : ''}
              </span>
            )}
            {' '}need your immediate attention.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => {
              setDismissed(true);
              const el = document.getElementById('priority-actions');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>
              Review Now
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
              Dismiss
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
