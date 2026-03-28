'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  ArrowRight, 
  Database, 
  History,
  Calendar,
  User as UserIcon,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp, useUsers } from '@/lib/store';
import { supabaseService } from '@/lib/supabase-service';
import { AuditLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AuditLogViewer() {
  const { currentUser } = useApp();
  const users = useUsers();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    return matchesSearch && matchesAction && matchesEntity;
  });

  if (currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Shield className="h-16 w-16 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
        <p className="text-muted-foreground text-sm">Only system administrators can view compliance audit logs.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-blue-500/30 text-blue-600">
              Compliance Module
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Immutable Audit Trail</h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            A comprehensive, searchable record of every database mutation. Mandatory for laboratory compliance and internal research accountability.
          </p>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-4 py-2 rounded-2xl border border-border/50">
          <History className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{logs.length} Operations Captured</span>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-blue-500/5 bg-background/50 backdrop-blur-xl border border-border/50 rounded-[2rem] overflow-hidden">
        <CardHeader className="border-b bg-muted/10 pb-8 pt-8 px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-1 md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Entity ID or Type..." 
                className="pl-10 h-12 bg-background/50 border-none ring-1 ring-border shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-12 bg-background/50 border-none ring-1 ring-border font-bold text-xs uppercase tracking-widest">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="INSERT">Insert</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="h-12 bg-background/50 border-none ring-1 ring-border font-bold text-xs uppercase tracking-widest">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entities</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="profile">Profiles</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[200px] text-[10px] font-black uppercase tracking-widest py-6 pl-8">Actor</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 text-center">Action</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Target Entity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-6">Operation Details</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest py-6 pr-8">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={5} className="h-16 bg-muted/10" />
                    </TableRow>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
                      No audit entries found matching criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const actor = users.find(u => u.id === log.actorId);
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/20 border-border/30 group">
                        <TableCell className="py-6 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                              <UserIcon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-black tracking-tight">{actor?.name || 'Unknown'}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">{actor?.role || 'System'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                            log.action === 'INSERT' ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/30" :
                            log.action === 'UPDATE' ? "bg-blue-500/10 text-blue-600 dark:bg-blue-900/30" :
                            "bg-rose-500/10 text-rose-600 dark:bg-rose-900/30"
                          )}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{log.entityType}</span>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground/60">{log.entityId.slice(0, 8)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="flex flex-col gap-1">
                            {log.action === 'UPDATE' ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 truncate max-w-[140px]">
                                  {JSON.stringify(log.oldValue).slice(0, 30)}...
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20 truncate max-w-[140px]">
                                  {JSON.stringify(log.newValue).slice(0, 30)}...
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-medium italic text-muted-foreground line-clamp-1">
                                {JSON.stringify(log.newValue || log.oldValue)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold tabular-nums">{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                            <span className="text-[9px] font-bold uppercase text-muted-foreground/50 tabular-nums">{format(new Date(log.createdAt), 'yyyy')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-[1.5rem] bg-orange-500/5 border border-orange-500/10 space-y-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-orange-600">Integrity Check</h3>
          <p className="text-[11px] font-medium leading-relaxed text-orange-700/70">
            Database level triggers ensure these logs cannot be modified or deleted, even by database administrators.
          </p>
        </div>
        <div className="md:col-span-2 p-6 rounded-[1.5rem] bg-muted/20 border border-border/50 flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border shadow-sm">
              <Tag className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest">Compliance Export</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Generate a signed PDF report for research auditing purposes.</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto font-black text-[9px] uppercase tracking-widest border-2 h-9 px-4">
              Generate Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
