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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp, useProject, useUsers, useCurrentUser } from '@/lib/store';
import { departmentColors } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function ProjectNotesPanel() {
  const { selectedProjectId, setSelectedProjectId, addProjectComment, updateProject } = useApp();
  const project = useProject(selectedProjectId || undefined);
  const users = useUsers();
  const currentUser = useCurrentUser();
  
  const [newComment, setNewComment] = useState('');
  const [newElnUrl, setNewElnUrl] = useState('');

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

  const handleAddElnLink = () => {
    const url = newElnUrl.trim();
    if (!url) return;
    
    const existingLink = project.elnLinks.find(l => l.userId === currentUser.id);
    let updatedLinks;
    
    if (existingLink) {
      updatedLinks = project.elnLinks.map(l => 
        l.userId === currentUser.id 
          ? { ...l, urls: [...l.urls, url] }
          : l
      );
    } else {
      updatedLinks = [...project.elnLinks, { userId: currentUser.id, urls: [url] }];
    }
    
    updateProject(project.id, { elnLinks: updatedLinks });
    setNewElnUrl('');
  };

  const memberUsers = project.memberIds.map(id => users.find(u => u.id === id)).filter(Boolean);

  return (
    <Sheet open={!!selectedProjectId} onOpenChange={(open) => !open && setSelectedProjectId(null)}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', departmentColors[project.department])}>
              {project.department}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-semibold">{project.name}</SheetTitle>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </SheetHeader>

        <Tabs defaultValue="notes" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="notes" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="eln" className="flex-1">
              <Link2 className="h-4 w-4 mr-2" />
              ELN Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-4 space-y-4">
            {/* Comments */}
            <div className="space-y-3">
              {project.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes yet. Start the conversation!
                </p>
              ) : (
                project.comments.map((comment) => {
                  const author = users.find(u => u.id === comment.userId);
                  return (
                    <div 
                      key={comment.id} 
                      className={cn(
                        'p-3 rounded-lg',
                        comment.isLeadershipNote 
                          ? 'bg-amber-500/10 border border-amber-500/20' 
                          : 'bg-muted/50'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {author ? getInitials(author.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{author?.name || 'Unknown'}</span>
                        {comment.isLeadershipNote && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Leadership Note
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button 
                size="sm" 
                onClick={handleAddComment} 
                disabled={!newComment.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Post Note
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="eln" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Electronic Lab Notebook links for project members
            </p>
            
            {project.elnLinks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No ELN links added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {project.elnLinks.map((link) => {
                  const user = users.find(u => u.id === link.userId);
                  if (!user) return null;
                  return (
                    <div 
                      key={link.userId}
                      className="p-3 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm">{user.name}</p>
                      </div>
                      <div className="space-y-1 pl-11">
                        {link.urls.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                            <a 
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline truncate flex-1 flex items-center gap-1"
                            >
                              <Link2 className="h-3 w-3 shrink-0" />
                              {url}
                            </a>
                            {(currentUser.role === 'admin' || currentUser.id === link.userId) && (
                              <button 
                                onClick={() => {
                                  const updatedLinks = project.elnLinks.map(l => 
                                    l.userId === link.userId 
                                      ? { ...l, urls: l.urls.filter((_, i) => i !== idx) }
                                      : l
                                  ).filter(l => l.urls.length > 0);
                                  updateProject(project.id, { elnLinks: updatedLinks });
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Separator />

            {/* Add/Manage ELN Links */}
            <div className="space-y-4">
              <p className="text-sm font-medium">Manage My ELN Links</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="https://..."
                  className="flex-1 h-9 text-xs bg-accent/30 border-none focus-visible:ring-blue-500/30"
                  value={newElnUrl}
                  onChange={(e) => setNewElnUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddElnLink()}
                />
                <Button 
                  size="sm" 
                  className="h-9 bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] tracking-widest"
                  onClick={handleAddElnLink}
                  disabled={!newElnUrl.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experiment Link
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">Project Members</p>
              <div className="space-y-2">
                {memberUsers.map((user) => {
                  if (!user) return null;
                  const userLinks = project.elnLinks.find(l => l.userId === user.id);
                  return (
                    <div 
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.department}</p>
                      </div>
                      {userLinks && userLinks.urls.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {userLinks.urls.length} Link{userLinks.urls.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
