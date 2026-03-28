'use client';

import { 
  Check, 
  X, 
  Clock, 
  User as UserIcon, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useApp, useUsers } from '@/lib/store';
import { cn } from '@/lib/utils';
import { TaskLog } from '@/lib/types';

interface TimesheetTableProps {
  logs: TaskLog[];
  showActions?: boolean;
}

export function TimesheetTable({ logs, showActions = false }: TimesheetTableProps) {
  const { approveTaskLog } = useApp();
  const users = useUsers();

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl opacity-50">
        <Clock className="h-12 w-12 mb-4" />
        <p className="font-bold uppercase tracking-widest text-sm">No Time Logs Found</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-black text-[10px] uppercase tracking-widest">Employee</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest">Date</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest">Activity</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Hours</TableHead>
            <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
            {showActions && <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarFallback className="text-[10px] font-bold">
                      {getInitials(log.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight">{log.userName}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter opacity-60">
                      {users.find(u => u.id === log.userId)?.department || 'Staff'}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-xs font-medium tabular-nums">{log.logDate}</span>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <p className="text-sm text-muted-foreground truncate italic group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                  "{log.content}"
                </p>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="font-black tabular-nums bg-accent">
                  {log.hoursLogged.toFixed(1)}h
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge 
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border shadow-none",
                    getStatusColor(log.approvalStatus)
                  )}
                >
                  {log.approvalStatus}
                </Badge>
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  {log.approvalStatus === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                        onClick={() => approveTaskLog(log.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white transition-all"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-muted-foreground/40 pr-4">Processed</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
