'use client';

import { Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useDashboardStats, useApp, useUser } from '@/lib/store';
import { departmentColors } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const loadColors = {
  light: 'bg-emerald-500',
  normal: 'bg-blue-500',
  heavy: 'bg-orange-500',
  overloaded: 'bg-red-500',
};

const loadLabels = {
  light: 'Light',
  normal: 'Normal',
  heavy: 'Heavy',
  overloaded: 'Overloaded',
};

export function TeamWorkload() {
  const stats = useDashboardStats();
  const { setSelectedUserId } = useApp();

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Sort by issues (overloaded first, then by late tasks)
  const sortedWorkload = [...stats.teamWorkload].sort((a, b) => {
    const loadOrder = { overloaded: 0, heavy: 1, normal: 2, light: 3 };
    if (loadOrder[a.load] !== loadOrder[b.load]) {
      return loadOrder[a.load] - loadOrder[b.load];
    }
    return b.lateTasks - a.lateTasks;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Team Workload</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Light
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Normal
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> Heavy
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Overloaded
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedWorkload.slice(0, 8).map((item) => {
            const UserRow = () => {
              const user = useUser(item.userId);
              if (!user) return null;

              return (
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-secondary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5', departmentColors[user.department])}>
                        {user.department}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress 
                        value={Math.min((item.taskCount / 10) * 100, 100)} 
                        className="h-1.5 flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-14">
                        {item.taskCount} tasks
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.lateTasks > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {item.lateTasks} late
                      </Badge>
                    )}
                    <Badge 
                      variant="outline"
                      className={cn(
                        'text-xs text-white border-0',
                        loadColors[item.load]
                      )}
                    >
                      {loadLabels[item.load]}
                    </Badge>
                  </div>
                </div>
              );
            };
            
            return <UserRow key={item.userId} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
