'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  FileDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/lib/store';
import { TimesheetTable } from '@/components/timesheet-table';
import { supabaseService } from '@/lib/supabase-service';
import { TaskLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function TimesheetsPage() {
  const currentUser = useCurrentUser();
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-logs');
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getTimesheets(undefined, { start: startDate, end: endDate });
      
      if (activeTab === 'my-logs') {
        setLogs(data.filter(log => log.userId === currentUser.id));
      } else {
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHours = logs.reduce((sum, log) => sum + log.hoursLogged, 0);
  const pendingHours = logs.filter(l => l.approvalStatus === 'pending').reduce((sum, log) => sum + log.hoursLogged, 0);
  const approvedHours = logs.filter(l => l.approvalStatus === 'approved').reduce((sum, log) => sum + log.hoursLogged, 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-blue-600 font-black text-[10px] uppercase tracking-widest px-2 py-0.5">Time Intelligence</Badge>
          <h1 className="text-4xl font-black tracking-tighter">Enterprise Timesheets</h1>
          <p className="text-muted-foreground font-medium italic">Immutable audit log and time tracking for research operations.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex border rounded-lg overflow-hidden h-10 shadow-sm">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 text-xs font-bold border-r focus:outline-none bg-background"
            />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 text-xs font-bold focus:outline-none bg-background"
            />
          </div>
          <Button 
            variant="outline" 
            className="h-10 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
            onClick={() => {
              const url = `/timesheets/export?start=${startDate}&end=${endDate}${activeTab === 'my-logs' ? `&userId=${currentUser.id}` : ''}`;
              window.open(url, '_blank');
            }}
          >
            <FileDown className="h-3.5 w-3.5" /> Export Report
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Logged</p>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tighter">{totalHours.toFixed(1)}h</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 font-bold uppercase tracking-widest">
              <TrendingUp className="h-3 w-3" />
              Period Summary
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm border-amber-500/20 bg-amber-500/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Approval</p>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tighter text-amber-600">{pendingHours.toFixed(1)}h</p>
            <p className="mt-2 text-xs text-muted-foreground font-medium">Awaiting supervisor review</p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm border-emerald-500/20 bg-emerald-500/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Validated Time</p>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tighter text-emerald-600">{approvedHours.toFixed(1)}h</p>
            <p className="mt-2 text-xs text-muted-foreground font-medium">Approved for payroll/billing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Section */}
      <Tabs defaultValue="my-logs" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted/50 p-1 border h-10">
            <TabsTrigger value="my-logs" className="text-[10px] font-black uppercase tracking-widest px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              My Time Logs
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="team-logs" className="text-[10px] font-black uppercase tracking-widest px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Team Oversight
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={fetchLogs}>
               <Filter className="h-4 w-4" />
             </Button>
          </div>
        </div>

        <TabsContent value="my-logs" className="mt-0">
          <TimesheetTable logs={logs} />
        </TabsContent>

        <TabsContent value="team-logs" className="mt-0">
          <TimesheetTable logs={logs} showActions={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
