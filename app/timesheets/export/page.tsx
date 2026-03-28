'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseService } from '@/lib/supabase-service';
import { useUsers } from '@/lib/store';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { Dna, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function ExportContent() {
  const searchParams = useSearchParams();
  const users = useUsers();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = searchParams.get('userId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  useEffect(() => {
    async function fetchData() {
      if (!start || !end) return;
      try {
        const logs = await supabaseService.getTimesheets(userId || undefined, { start, end });
        setData(logs);
        setLoading(false);
        // Trigger print after a short delay to ensure rendering
        setTimeout(() => window.print(), 1000);
      } catch (error) {
        console.error('Export Error:', error);
      }
    }
    fetchData();
  }, [userId, start, end]);

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-muted-foreground">Preparing Research Report...</div>;

  const user = users.find(u => u.id === userId);
  const totalHours = data.reduce((acc, log) => acc + (log.hoursLogged || 0), 0);

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-8 print:p-0 print:max-w-none">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-black text-white p-1 rounded">
              <Dna className="h-5 w-5" />
            </div>
            <span className="font-black tracking-[0.3em] text-xl">SYNAPSE</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Timesheet Compliance Report</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Period: {format(parseISO(start!), 'MMM dd, yyyy')} — {format(parseISO(end!), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="text-right space-y-1">
          <Badge variant="outline" className="border-black font-black text-[10px] uppercase tracking-widest">
            Official Document
          </Badge>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Generated: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
        </div>
      </div>

      {/* Meta Information */}
      <div className="grid grid-cols-2 gap-8 py-4 px-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Resource</p>
          <p className="text-lg font-black">{user?.name || 'All Staff'}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase">{user?.role || 'Organization-wide'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Compliance Hours</p>
          <p className="text-3xl font-black tabular-nums">{totalHours.toFixed(2)}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase">Certified Log Entries</p>
        </div>
      </div>

      {/* Data Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-4 text-[10px] font-black uppercase tracking-widest">Date</th>
            <th className="py-4 text-[10px] font-black uppercase tracking-widest">Project / Task</th>
            <th className="py-4 text-[10px] font-black uppercase tracking-widest">Description</th>
            <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Hours</th>
          </tr>
        </thead>
        <tbody>
          {data.map((log) => (
            <tr key={log.id} className="border-b border-muted/50 page-break-inside-avoid">
              <td className="py-4 text-xs font-bold tabular-nums">{format(parseISO(log.log_date), 'yyyy-MM-dd')}</td>
              <td className="py-4">
                <p className="text-xs font-black leading-none">{log.projectName}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 line-clamp-1">{log.taskTitle}</p>
              </td>
              <td className="py-4 text-xs font-medium italic text-muted-foreground">{log.content}</td>
              <td className="py-4 text-right text-xs font-black tabular-nums">{(log.hoursLogged || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer / Signature */}
      <div className="pt-20 grid grid-cols-2 gap-20">
        <div className="border-t border-black pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resource Signature</p>
          <p className="text-[9px] font-medium text-muted-foreground/50 mt-1 italic">Electronically logged via Synapse PMS</p>
        </div>
        <div className="border-t border-black pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Supervisor Verification</p>
          <div className="mt-4 flex items-center gap-2 opacity-30">
            <Shield className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Certified & Audited</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}

export default function TimesheetExportPage() {
  return (
    <Suspense fallback={<div>Loading Export...</div>}>
      <ExportContent />
    </Suspense>
  );
}
