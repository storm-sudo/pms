'use client';

import { useState } from 'react';
import { X, MessageSquare, Link2, Send, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useApp, useProject, useUsers, useCurrentUser } from '@/lib/store';
import { departmentColors } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function ProjectNotesPanel() {
  const { selectedProjectId, setSelectedProjectId, addProjectComment, updateProject } = useApp();
  const project = useProject(selectedProjectId || undefined);
  const users = useUsers();
  const currentUser = useCurrentUser();
  
  const [newComment, setNewComment] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [linkType, setLinkType] = useState<'eln' | 'other'>('eln');

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!project) return null;

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addProjectComment(project.id, {
      userId: currentUser.id,
      content: newComment.trim(),
    });
    setNewComment('');
  };

  const handleAddExternalLink = () => {
    const url = newLinkUrl.trim();
    if (!url) return;
    
    const newLink = {
      id: Math.random().toString(36).substring(2, 9),
      title: newLinkTitle.trim() || (linkType === 'eln' ? 'ELN Entry' : 'Resource Link'),
      url,
      userId: currentUser.id,
      type: linkType,
      createdAt: new Date().toISOString()
    };
    
    const updatedLinks = [...(project.externalLinks || []), newLink];
    updateProject(project.id, { externalLinks: updatedLinks });
    
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const memberUsers = project.memberIds.map(id => users.find(u => u.id === id)).filter(Boolean);

  return (
    <Sheet open={!!selectedProjectId} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-slate-950 text-slate-50 border-slate-800">
        <SheetHeader className="space-y-0 pb-4 shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider h-5', departmentColors[project.department])}>
              {project.department}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 border-slate-700 text-slate-400">
              {project.status}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold text-slate-100">{project.name}</SheetTitle>
          {project.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
          )}
        </SheetHeader>

        <Separator className="bg-slate-800 mb-2" />

        <div className="flex-1 flex flex-col min-h-0 gap-6 overflow-hidden">
          {/* Section 1: Project Notes */}
          <section className="flex flex-col h-[50%] min-h-0 bg-slate-900/40 rounded-xl border border-slate-800/50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-4 px-1">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              Project Intelligence & Notes
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-3 custom-scrollbar">
              {project.comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="h-10 w-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">No intelligence reports yet.</p>
                </div>
              ) : (
                project.comments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((comment) => {
                  const author = users.find(u => u.id === comment.userId);
                  return (
                    <div 
                      key={comment.id} 
                      className={cn(
                        'p-3 rounded-lg border transition-all duration-200',
                        comment.isLeadershipNote 
                          ? 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-900/10' 
                          : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-5 w-5 ring-1 ring-slate-700">
                          <AvatarFallback className="text-[9px] bg-slate-700 text-slate-300">
                            {author ? getInitials(author.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-slate-300">{author?.name || 'Unknown'}</span>
                        {comment.isLeadershipNote && (
                          <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-none px-1.5 h-4">
                            LEADERSHIP
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-500 ml-auto">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">{comment.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/50 space-y-2">
              <Textarea
                placeholder="Share project intelligence..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] max-h-[120px] bg-slate-950/50 border-slate-700 text-sm focus:border-blue-500/50 focus:ring-blue-500/10"
                rows={2}
              />
              <Button 
                size="sm" 
                onClick={handleAddComment} 
                disabled={!newComment.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-bold tracking-wider"
              >
                <Send className="h-3 w-3 mr-2" />
                POST INTELLIGENCE
              </Button>
            </div>
          </section>

          {/* Section 2: Resource Links */}
          <section className="flex flex-col h-[50%] min-h-0 bg-slate-900/40 rounded-xl border border-slate-800/50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-4 px-1">
              <Link2 className="h-4 w-4 text-emerald-400" />
              ELN & External Resources
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-2 custom-scrollbar">
              {(!project.externalLinks || project.externalLinks.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="h-10 w-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-2">
                    <Link2 className="h-5 w-5 text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">No links indexed for this project.</p>
                </div>
              ) : (
                project.externalLinks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((link) => {
                  const user = users.find(u => u.id === link.userId);
                  return (
                    <div key={link.id} className="group relative flex items-start gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                      <div className={cn(
                        "mt-1 p-1.5 rounded bg-slate-900",
                        link.type === 'eln' ? "text-emerald-400" : "text-blue-400"
                      )}>
                        <Link2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-200 truncate">{link.title}</span>
                          <Badge variant="secondary" className="text-[8px] h-3.5 bg-slate-900 text-slate-400 border-none italic">
                            {link.type.toUpperCase()}
                          </Badge>
                        </div>
                        <a 
                          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline block truncate mb-1"
                        >
                          {link.url}
                        </a>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500">
                          <span className="font-semibold text-slate-400">{user?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {(currentUser.role === 'admin' || currentUser.id === link.userId) && (
                        <button 
                          onClick={() => {
                            const updatedLinks = project.externalLinks.filter(l => l.id !== link.id);
                            updateProject(project.id, { externalLinks: updatedLinks });
                          }}
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Link Title (e.g. Protocol 123)"
                  className="bg-slate-950/50 border-slate-700 text-xs h-9"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                />
                <select 
                  className="bg-slate-950/50 border-slate-700 rounded-md text-xs h-9 px-2 text-slate-300 outline-none focus:ring-1 focus:ring-blue-500/30"
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as 'eln' | 'other')}
                >
                  <option value="eln">ELN Entry (Lab)</option>
                  <option value="other">Reference / External</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Paste URL here..."
                  className="flex-1 bg-slate-950/50 border-slate-700 text-xs h-9"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddExternalLink()}
                />
                <Button 
                  size="sm" 
                  className="h-9 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold tracking-widest px-4"
                  onClick={handleAddExternalLink}
                  disabled={!newLinkUrl.trim()}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  INDEX
                </Button>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
