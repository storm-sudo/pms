'use client';

import { useMemo } from 'react';
import { useApp, useUsers, useTasks } from '@/lib/store';
import { format, startOfWeek, addWeeks, isWithinInterval, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Info, User as UserIcon } from 'lucide-react';

export function ResourceHeatmap() {
  const users = useUsers().filter(u => u.role === 'member');
  const tasks = useTasks();
  
  const weeks = useMemo(() => {
    const start = startOfWeek(new Date());
    return [0, 1, 2, 3].map(offset => addWeeks(start, offset));
  }, []);

  const getLoadColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted/30';
    if (percentage <= 80) return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
    if (percentage <= 100) return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
    return 'bg-rose-500/30 text-rose-700 border-rose-500/40 animate-pulse';
  };

  const calculateLoad = (userId: string, weekStart: Date) => {
    const weekEnd = addWeeks(weekStart, 1);
    const userTasks = tasks.filter(t => 
      t.assigneeIds.includes(userId) && 
      t.status !== 'done' &&
      t.dueDate &&
      isWithinInterval(parseISO(t.dueDate), { start: weekStart, end: weekEnd })
    );

    const totalHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const user = users.find(u => u.id === userId);
    const capacity = user?.weeklyCapacityHours || 40;
    const percentage = (totalHours / capacity) * 100;

    return {
      hours: totalHours,
      percentage,
      tasks: userTasks,
      capacity
    };
  };

  return (
    <Card className="border-2 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
              Resource Intelligence Heatmap
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest px-1.5 py-0">4-Week Rolling</Badge>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
              Real-time capacity tracking across lab operations.
            </CardDescription>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5">
               <div className="h-3 w-3 rounded-sm bg-emerald-500/20 border" />
               <span className="text-[9px] font-bold uppercase">Healthy</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="h-3 w-3 rounded-sm bg-orange-500/20 border" />
               <span className="text-[9px] font-bold uppercase">At Capacity</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="h-3 w-3 rounded-sm bg-rose-500/30 border" />
               <span className="text-[9px] font-bold uppercase">Overload</span>
             </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 border-t-2">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week Headers */}
            <div className="grid grid-cols-[250px_repeat(4,1fr)] bg-muted/5 border-b uppercase">
              <div className="p-3 text-[10px] font-black tracking-widest text-muted-foreground border-r">Researcher</div>
              {weeks.map(week => (
                <div key={week.toISOString()} className="p-3 text-center border-r last:border-0">
                  <p className="text-[10px] font-black tracking-widest">Week of</p>
                  <p className="text-xs font-black">{format(week, 'MMM dd')}</p>
                </div>
              ))}
            </div>

            {/* User Rows */}
            <div className="divide-y">
              {users.map(user => (
                <div key={user.id} className="grid grid-cols-[250px_repeat(4,1fr)] hover:bg-muted/20 transition-colors">
                  <div className="p-4 border-r flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">{user.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.skills.slice(0, 2).map(skill => (
                          <Badge key={skill} variant="outline" className="text-[8px] py-0 px-1 font-bold bg-background">
                            {skill}
                          </Badge>
                        ))}
                        {user.skills.length > 2 && (
                          <span className="text-[8px] font-bold text-muted-foreground">+{user.skills.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <TooltipProvider>
                    {weeks.map(week => {
                      const load = calculateLoad(user.id, week);
                      return (
                        <div key={`${user.id}-${week.toISOString()}`} className="border-r last:border-0 p-2 flex items-center justify-center min-h-[80px]">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "w-full h-full rounded-md border p-3 flex flex-col justify-center items-center transition-all cursor-help hover:scale-[1.02]",
                                getLoadColor(load.percentage)
                              )}>
                                <p className="text-lg font-black leading-none">{load.percentage.toFixed(0)}%</p>
                                <p className="text-[9px] font-bold mt-1 uppercase tracking-tighter opacity-70">
                                  {load.hours.toFixed(1)} / {load.capacity}h
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="w-64 p-3 bg-card border-2 shadow-xl">
                              <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-1">Week Log</p>
                                {load.tasks.length > 0 ? (
                                  <div className="space-y-2">
                                    {load.tasks.map(task => (
                                      <div key={task.id} className="text-xs">
                                        <p className="font-black text-blue-600 truncate">{task.title}</p>
                                        <div className="flex items-center justify-between mt-1 text-[10px]">
                                          <Badge variant="outline" className="py-0 px-1 h-3">{task.priority}</Badge>
                                          <span className="font-bold tabular-nums">{task.estimatedHours}h</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs italic text-muted-foreground">No tasks assigned for this week.</p>
                                )}
                                <div className="pt-2 border-t flex justify-between items-center mt-2">
                                   <span className="text-[10px] font-bold uppercase">Total Utilization</span>
                                   <span className="text-xs font-black">{load.hours.toFixed(1)} Hours</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
