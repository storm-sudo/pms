'use client';

import { useMemo } from 'react';
import { generateActivityData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActivityHeatmapProps {
  userId: string;
  className?: string;
  compact?: boolean;
}

export function ActivityHeatmap({ userId, className, compact = false }: ActivityHeatmapProps) {
  const activity = useMemo(() => generateActivityData(userId), [userId]);
  
  // Group by weeks
  const weeks = useMemo(() => {
    const result: typeof activity[] = [];
    let currentWeek: typeof activity = [];
    
    activity.forEach((day, idx) => {
      const dayOfWeek = new Date(day.date).getDay();
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }
    
    return compact ? result.slice(-26) : result.slice(-52);
  }, [activity, compact]);

  const getHeatmapClass = (count: number) => {
    if (count === 0) return 'heatmap-0';
    if (count <= 1) return 'heatmap-1';
    if (count <= 2) return 'heatmap-2';
    if (count <= 3) return 'heatmap-3';
    return 'heatmap-4';
  };

  const months = useMemo(() => {
    const monthLabels: { month: string; col: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIdx) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            month: new Date(firstDay.date).toLocaleDateString('en-US', { month: 'short' }),
            col: weekIdx,
          });
          lastMonth = month;
        }
      }
    });
    
    return monthLabels;
  }, [weeks]);

  const totalContributions = activity.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className={cn('space-y-2', className)}>
      {!compact && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {totalContributions} tasks completed in the last year
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn('h-3 w-3 rounded-sm', `heatmap-${level}`)}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      )}
      
      {/* Month labels */}
      {!compact && (
        <div className="flex gap-[3px] ml-6 text-[10px] text-muted-foreground">
          {months.map((m, idx) => (
            <div
              key={idx}
              className="shrink-0"
              style={{ marginLeft: idx === 0 ? 0 : `${(m.col - (months[idx - 1]?.col || 0) - 1) * 13}px` }}
            >
              {m.month}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-[3px]">
        {/* Day labels */}
        {!compact && (
          <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground pr-1">
            <div className="h-[10px]" />
            <div className="h-[10px] leading-[10px]">Mon</div>
            <div className="h-[10px]" />
            <div className="h-[10px] leading-[10px]">Wed</div>
            <div className="h-[10px]" />
            <div className="h-[10px] leading-[10px]">Fri</div>
            <div className="h-[10px]" />
          </div>
        )}
        
        <TooltipProvider delayDuration={100}>
          <div className="flex gap-[3px] overflow-x-auto">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                  const day = week.find(d => new Date(d.date).getDay() === dayIdx);
                  if (!day) {
                    return <div key={dayIdx} className="h-[10px] w-[10px]" />;
                  }
                  return (
                    <Tooltip key={dayIdx}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'h-[10px] w-[10px] rounded-sm cursor-pointer transition-colors hover:ring-1 hover:ring-foreground/20',
                            getHeatmapClass(day.count)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{day.count} task{day.count !== 1 ? 's' : ''} completed</p>
                        <p className="text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
