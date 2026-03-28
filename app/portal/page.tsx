"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  ArrowRight,
  FlaskConical,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function PortalDashboard() {
  const { currentUser, getStakeholderProjects, getPublishedReports } = useApp();
  const [stakeholderProjects, setStakeholderProjects] = useState<any[]>([]);
  const [publishedDocs, setPublishedDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        const [projects, reports] = await Promise.all([
          getStakeholderProjects(currentUser.id),
          getPublishedReports()
        ]);
        setStakeholderProjects(projects);
        setPublishedDocs(reports.slice(0, 5));
      } catch (error) {
        console.error('Portal Data Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser, getStakeholderProjects, getPublishedReports]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground italic uppercase text-xs tracking-widest">Initializing Clinical Environment...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase leading-none">Stakeholder Dashboard</h1>
          <p className="text-muted-foreground mt-1">Authorized overview of laboratory progress and clinical report snapshots.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-lg border border-emerald-500/20">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Medical-Grade Encryption Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Active Trials</CardTitle>
            <FlaskConical className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">{stakeholderProjects.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">Assigned Project Contexts</p>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Published Snapshots</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end mr-2">
                  <span className="text-xs font-bold uppercase tracking-tight leading-none">{currentUser.name || currentUser.full_name}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none mt-1">Authorized Stakeholder</span>
                </div>
              </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">{publishedDocs.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">Authorized Protocol Releases</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Review Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">98%</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">On-Schedule Laboratory KPIs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-tight">Active Clinical Contexts</h2>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest group">
              View All <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="space-y-3">
            {stakeholderProjects.length === 0 ? (
              <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground italic uppercase text-xs">
                No active trials assigned to this stakeholder account.
              </div>
            ) : (
              stakeholderProjects.map(project => (
                <Link key={project.id} href={`/portal/projects/${project.id}`}>
                  <div className="bg-card border-2 hover:border-primary transition-all p-4 rounded-xl group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold uppercase tracking-tight text-lg">{project.name}</h3>
                      <Badge className="bg-primary text-[10px] font-bold uppercase tracking-widest">ACTIVE</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 uppercase tracking-tight leading-relaxed mb-4">
                      {project.description || "No tactical description provided."}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Ends: {format(new Date(project.dueDate || ''), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        {publishedDocs.filter(d => d.projectId === project.id).length} Snapshots
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-8 -mt-8 rounded-full group-hover:bg-primary/10 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Latest Reports */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold uppercase tracking-tight">Latest Protocol Snapshots</h2>
          <div className="bg-card border-2 rounded-xl divide-y-2">
            {publishedDocs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground italic uppercase text-xs">
                No clinical discoveries have been published for your projects yet.
              </div>
            ) : (
              publishedDocs.map(doc => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                      <FileText className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold uppercase tracking-tight text-sm mb-0.5">{doc.name}</h4>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span>{format(new Date(doc.publishedAt || doc.createdAt), 'MMM dd, HH:mm')}</span>
                        <span className="h-1 w-1 bg-border rounded-full" />
                        <span>v{doc.version}.0 ARCHIVE</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-2 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm" onClick={() => window.open(doc.fileUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
