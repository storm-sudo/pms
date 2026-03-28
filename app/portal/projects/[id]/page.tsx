"use client";

import { useApp } from '@/lib/store';
import { useParams } from 'next/navigation';
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Send,
  History
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabaseService } from '@/lib/supabase-service';

export default function StakeholderProjectView() {
  const { id } = useParams();
  const { currentUser, getStakeholderProjects, publishedReports, stakeholderFeedback, addPortalComment } = useApp();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [project, setProject] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!currentUser) return;
      try {
        const projects = await getStakeholderProjects(currentUser.id);
        const found = projects.find(p => p.id === id);
        setProject(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id, currentUser, getStakeholderProjects]);

  const projectReports = publishedReports.filter(r => r.projectId === id);
  const activeReportComments = stakeholderFeedback.filter(f => f.reportId === activeDocId);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground italic uppercase text-xs tracking-widest">Validating Project Context...</div>;

  if (!project) {
    return <div className="p-8 text-center uppercase tracking-widest font-bold">Unauthorized Clinical Access</div>;
  }

  const handlePostComment = async () => {
    if (!activeDocId || !commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await addPortalComment(activeDocId, commentText);
      setCommentText("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-2">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest group">
          <Link href="/portal" className="flex items-center">
            <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tighter uppercase">{project.name}</h1>
            <Badge className="bg-primary uppercase font-bold text-[10px] tracking-widest h-5 px-1.5">Clinical Live</Badge>
          </div>
          <p className="text-muted-foreground uppercase tracking-tight text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Project Conclusion: {format(new Date(project.dueDate), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 shadow-sm relative overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Published Discovery Repository
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Clinical Protocol / Snapshot</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Audit Date</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center text-muted-foreground uppercase tracking-widest text-xs font-bold italic">
                        No official snapshots released for this trial context.
                      </TableCell>
                    </TableRow>
                  ) : (
                    projectReports.map((doc: any) => (
                      <TableRow key={doc.id} className={`hover:bg-primary/5 transition-colors cursor-pointer group ${activeDocId === doc.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`} onClick={() => setActiveDocId(doc.id)}>
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold uppercase tracking-tight text-sm group-hover:text-primary transition-colors">{doc.name}</span>
                            <div className="flex gap-2">
                              {doc.content.tags.map((tag: any) => (
                                <span key={tag} className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">#{tag}</span>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
                          {format(new Date(doc.publishedAt), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell className="text-right pr-6 flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 hover:bg-emerald-500 hover:text-white border-2 p-0">
                            <Link href={`/portal/reports/${doc.id}/export`} target="_blank">
                              <FileText className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 hover:bg-primary hover:text-white border-2 p-0" onClick={(e) => { e.stopPropagation(); window.open(doc.fileUrl, '_blank'); }}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-12 -mt-12 rounded-full opacity-50" />
          </Card>

          {/* Clinical Context Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-card border-2 p-4 rounded-xl">
              <div className="text-2xl font-bold tracking-tighter">v{projectReports.length > 0 ? Math.max(...projectReports.map(d => d.version)) : 0}.0</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">LATEST ARCHIVE vERSION</div>
            </div>
            <div className="bg-card border-2 p-4 rounded-xl">
              <div className="text-2xl font-bold tracking-tighter">100%</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">PROTOCOL ADHERENCE</div>
            </div>
          </div>
        </div>

        {/* Stakeholder Feedback Overlay */}
        <div className="space-y-6 h-full">
          <Card className="border-2 border-primary shadow-lg flex flex-col h-full sticky top-24">
            <CardHeader className="bg-primary text-white">
              <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-between">
                Stakeholder Feedback
                <ShieldCheck className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col flex-1">
              {!activeDocId ? (
                <div className="p-8 text-center text-muted-foreground space-y-4 flex flex-col items-center justify-center min-h-[400px]">
                  <MessageSquare className="h-12 w-12 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Select a clinical snapshot to initiate collaborative feedback.</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[500px]">
                    <div className="flex items-center gap-2 pb-2 border-b-2 mb-2">
                       <History className="h-3 w-3 text-primary" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AUDIT LOG: {projectReports.find(d => d.id === activeDocId)?.name}</span>
                    </div>
                    {activeReportComments.length === 0 ? (
                      <p className="text-center text-muted-foreground italic text-xs py-8">No feedback archived for this snapshot.</p>
                    ) : (
                      activeReportComments.map((comment: any) => (
                        <div key={comment.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{comment.userName}</span>
                            <span className="text-[9px] font-mono text-muted-foreground">{format(new Date(comment.created_at), 'HH:mm')}</span>
                          </div>
                          <div className="bg-muted p-2 rounded-lg text-xs font-bold tracking-tight uppercase border shadow-sm">
                            {comment.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t bg-muted/50 mt-auto">
                    <div className="relative">
                      <textarea
                        className="w-full bg-background border-2 border-primary/20 rounded-lg p-3 text-xs font-bold uppercase tracking-tight min-h-[100px] focus:border-primary outline-none transition-all placeholder:opacity-50"
                        placeholder="ENTER TACTICAL FEEDBACK..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        disabled={isSubmitting || !commentText.trim()}
                        className="absolute bottom-3 right-3 h-8 px-3 font-bold uppercase tracking-widest"
                        onClick={handlePostComment}
                      >
                        {isSubmitting ? "SYNC..." : <><Send className="mr-2 h-3 w-3" /> ARCHIVE</>}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
