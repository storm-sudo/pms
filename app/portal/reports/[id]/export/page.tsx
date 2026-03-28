'use client';

import { useApp } from '@/lib/store';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PublishedReport } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ReportExportPage() {
  const { id } = useParams();
  const { getPublishedReports } = useApp();
  const [report, setReport] = useState<PublishedReport | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      const reports = await getPublishedReports();
      const found = reports.find(r => r.id === id);
      if (found) {
        setReport(found);
      }
    };
    fetchReport();
  }, [id, getPublishedReports]);

  if (!report) return <div className="p-8 text-center text-muted-foreground italic">Loading clinical protocol...</div>;

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          @page { margin: 2cm; }
        }
      `}</style>

      <div className="mx-auto max-w-4xl space-y-8 bg-white print:max-w-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Synapse Clinical Protocol</h1>
            <p className="text-slate-500">Official Project Snapshot & Research Record</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-semibold text-slate-900">NucleoVir Labs</p>
            <p>Report ID: {report.id.slice(0, 8).toUpperCase()}</p>
            <p>Generated: {format(new Date(), 'PPP p')}</p>
          </div>
        </div>

        {/* Branding/Status */}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4 print:bg-slate-50">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Focus</p>
            <p className="text-lg font-semibold text-slate-900">{report.content.projectName}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge variant="outline" className="border-slate-300 text-slate-700">VERSION {report.version}</Badge>
            <p className="text-[10px] italic text-slate-500 uppercase">Released: {format(new Date(report.published_at), 'PPP')}</p>
          </div>
        </div>

        {/* Content */}
        <Card className="border-none shadow-none print:shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl text-slate-900">{report.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <div className="space-y-4 leading-relaxed text-slate-700">
              <p>
                This clinical snapshot represents a version-controlled protocol release for the study related to 
                <strong> {report.content.projectName}</strong>. This document has been officially published and archived 
                within the Synapse PMS ecosystem for stakeholder review and clinical auditing.
              </p>
              
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 italic text-slate-600">
                Resource URI: <span className="font-mono text-xs">{report.file_url}</span>
              </div>
            </div>

            {/* Tags Section */}
            {report.content.tags && report.content.tags.length > 0 && (
              <div className="space-y-2 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Classification Tags</p>
                <div className="flex flex-wrap gap-2">
                  {report.content.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} NucleoVir Laboratory Operations. Confidential & Proprietary.</p>
          <p className="mt-1 no-print">Click Ctrl+P to Print or Save as PDF</p>
        </div>
      </div>

      {/* Auto-print trigger in separate script for reliability */}
      <div className="no-print fixed bottom-8 right-8">
        <button 
          onClick={() => window.print()}
          className="rounded-full bg-slate-900 px-6 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          Generate PDF
        </button>
      </div>
    </div>
  );
}
