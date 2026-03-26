'use client';

import { useState } from 'react';
import {
  Search,
  Mail,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useApp, useUsers, useTasks, useIsAdmin } from '@/lib/store';
import { departmentColors } from '@/lib/mock-data';
import { Department } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ActivityHeatmap } from '@/components/activity-heatmap';

function TeamMemberCard({ userId }: { userId: string }) {
  const users = useUsers();
  const tasks = useTasks();
  const { setSelectedUserId } = useApp();
  
  const user = users.find(u => u.id === userId);
  if (!user) return null;

  // Updated to use assigneeIds array
  const userTasks = tasks.filter(t => t.assigneeIds.includes(user.id));
  const activeTasks = userTasks.filter(t => t.status !== 'done');
  const completedTasks = userTasks.filter(t => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < today);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const workloadLevel = activeTasks.length > 8 ? 'overloaded' : 
                        activeTasks.length > 5 ? 'heavy' : 
                        activeTasks.length > 2 ? 'normal' : 'light';

  const workloadColors = {
    light: 'bg-emerald-500',
    normal: 'bg-blue-500',
    heavy: 'bg-orange-500',
    overloaded: 'bg-red-500',
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden"
      onClick={() => setSelectedUserId(user.id)}
    >
      <CardContent className="p-0">
        {/* Header with department color */}
        <div className={cn(
          'h-2',
          user.department === 'Mol Bio' ? 'bg-blue-500' :
          user.department === 'AI' ? 'bg-purple-500' :
          user.department === 'Bioinfo' ? 'bg-emerald-500' :
          'bg-amber-500'
        )} />
        
        <div className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-secondary text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{user.name}</h3>
                {user.role === 'admin' && (
                  <Shield className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', departmentColors[user.department])}>
                  {user.department}
                </Badge>
                {user.status !== 'approved' && (
                   <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">
                    {user.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Workload indicator */}
            <div className={cn(
              'h-3 w-3 rounded-full shrink-0',
              workloadColors[workloadLevel]
            )} title={`Workload: ${workloadLevel}`} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <p className="text-lg font-bold">{activeTasks.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-500">{completedTasks.length}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
            <div>
              <p className={cn(
                'text-lg font-bold',
                overdueTasks.length > 0 ? 'text-destructive' : ''
              )}>
                {overdueTasks.length}
              </p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>

          {/* Mini Heatmap */}
          <div className="mt-4">
            <ActivityHeatmap userId={user.id} compact />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const isAdmin = useIsAdmin();
  const users = useUsers();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');

  // Filter out pending users for the public directory unless self or admin
  const filteredUsers = users.filter(u => {
    // Hide unapproved users from the main directory (they should be in User Management)
    if (u.status !== 'approved' && u.role !== 'admin') return false;
    
    if (u.role === 'admin' && u.department === 'Leadership') return true; 
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (departmentFilter !== 'all' && u.department !== departmentFilter) return false;
    return true;
  });

  const departments: (Department | 'all')[] = ['all', 'Leadership', 'Mol Bio', 'AI', 'Bioinfo'];

  // Group by department
  const leadershipUsers = filteredUsers.filter(u => u.department === 'Leadership');
  const molBioUsers = filteredUsers.filter(u => u.department === 'Mol Bio');
  const aiUsers = filteredUsers.filter(u => u.department === 'AI');
  const bioinfoUsers = filteredUsers.filter(u => u.department === 'Bioinfo');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Directory</h1>
          <p className="text-muted-foreground">{filteredUsers.length} approved members across departments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2 text-xs">
          {departments.map((dept) => (
            <Button
              key={dept}
              variant={departmentFilter === dept ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDepartmentFilter(dept)}
            >
              {dept === 'all' ? 'All' : dept}
            </Button>
          ))}
        </div>
      </div>

      {/* Leadership */}
      {leadershipUsers.length > 0 && (departmentFilter === 'all' || departmentFilter === 'Leadership') && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            Leadership
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leadershipUsers.map(user => (
              <TeamMemberCard key={user.id} userId={user.id} />
            ))}
          </div>
        </div>
      )}

      {/* Mol Bio */}
      {molBioUsers.length > 0 && (departmentFilter === 'all' || departmentFilter === 'Mol Bio') && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            Molecular Biology
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {molBioUsers.map(user => (
              <TeamMemberCard key={user.id} userId={user.id} />
            ))}
          </div>
        </div>
      )}

      {/* AI */}
      {aiUsers.length > 0 && (departmentFilter === 'all' || departmentFilter === 'AI') && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            Artificial Intelligence
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiUsers.map(user => (
              <TeamMemberCard key={user.id} userId={user.id} />
            ))}
          </div>
        </div>
      )}

      {/* Bioinfo */}
      {bioinfoUsers.length > 0 && (departmentFilter === 'all' || departmentFilter === 'Bioinfo') && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            Bioinformatics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bioinfoUsers.map(user => (
              <TeamMemberCard key={user.id} userId={user.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
