'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Send,
  Link2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp, useUser, useTasks, useCurrentUser, useIsAdmin, useUsers } from '@/lib/store';
import { departmentColors } from '@/lib/mock-data';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { cn } from '@/lib/utils';

interface LeadershipNote {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export function UserProfilePanel() {
  const { selectedUserId, setSelectedUserId, updateUser } = useApp();
  const user = useUser(selectedUserId || undefined);
  const users = useUsers();
  const currentUser = useCurrentUser();
  const isAdmin = useIsAdmin();
  const tasks = useTasks();
  
  const [newNote, setNewNote] = useState('');
  // In a real app, these would be stored in the database
  const [leadershipNotes, setLeadershipNotes] = useState<LeadershipNote[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDepartment, setEditedDepartment] = useState('');
  const [editedRole, setEditedRole] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  useEffect(() => {
    if (user) {
      setEditedName(user.name);
      setEditedDepartment(user.department);
      setEditedRole(user.role);
      setEditedEmail(user.email);
      setIsEditing(false);
    }
  }, [user]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!user) return null;

  const userTasks = tasks.filter(t => t.assigneeIds.includes(user.id));
  const activeTasks = userTasks.filter(t => t.status !== 'done');
  const completedTasks = userTasks.filter(t => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < today);
  const blockedTasks = activeTasks.filter(t => t.status === 'blocked');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: LeadershipNote = {
      id: `ln${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUser.id,
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
    };
    setLeadershipNotes([...leadershipNotes, note]);
    setNewNote('');
  };

  return (
    <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-6 pb-6 border-b">
          <div className="flex items-center justify-between w-full pt-2">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-xl">
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background",
                  user.workload.activeTasks > 5 ? "bg-red-500" : "bg-emerald-500"
                )} />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={editedName} onChange={e => setEditedName(e.target.value)} className="h-9 py-1 text-lg font-bold bg-accent/50" />
                    <div className="flex gap-2 mt-1">
                      <Input value={editedDepartment} onChange={e => setEditedDepartment(e.target.value)} className="h-7 py-0 px-2 text-xs w-28 bg-accent/50" placeholder="Dept" />
                      <Input value={editedRole} onChange={e => setEditedRole(e.target.value)} className="h-7 py-0 px-2 text-xs w-28 bg-accent/50" placeholder="Role" />
                    </div>
                  </div>
                ) : (
                  <>
                    <SheetTitle className="text-2xl font-black tracking-tight">{user.name}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={cn('text-[10px] uppercase font-bold tracking-widest px-2 py-0.5', departmentColors[user.department || 'Leadership'])}>
                        {user.department}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-blue-100/50 text-blue-700 border-blue-200/50">
                        {user.role}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
            {isAdmin && (
              <Button size="sm" variant="outline" className="h-9 px-4 font-semibold hover:bg-accent transition-all" onClick={() => {
                if (isEditing) {
                  updateUser(user.id, { name: editedName, department: editedDepartment as any, role: editedRole as any, email: editedEmail });
                }
                setIsEditing(!isEditing);
              }}>
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Mail className="h-4 w-4 text-blue-500" />
              {isEditing ? (
                <Input value={editedEmail} onChange={e => setEditedEmail(e.target.value)} className="h-7 py-0 px-2 text-xs w-48 bg-accent/50" placeholder="Email" />
              ) : (
                <span className="font-medium">{user.email}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </SheetHeader>

        {/* Quick Stats */}
        {/* Quick Stats - Rearranged to 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 my-8">
          <Card className="bg-blue-50/30 dark:bg-blue-500/5 border-blue-100 dark:border-blue-500/20 shadow-sm transition-all hover:shadow-md h-[90px] flex flex-col justify-center">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-widest">Active Projects</p>
                <p className="text-3xl font-black mt-1 leading-none">{activeTasks.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/20" />
            </CardContent>
          </Card>
          <Card className="bg-emerald-50/30 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 shadow-sm transition-all hover:shadow-md h-[90px] flex flex-col justify-center">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">Completed</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mt-1 leading-none">{completedTasks.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
            </CardContent>
          </Card>
          <Card className={cn(
             "h-[90px] flex flex-col justify-center shadow-sm transition-all hover:shadow-md",
             overdueTasks.length > 0 ? 'bg-red-50/30 dark:bg-red-500/5 border-red-200 dark:border-red-500/30' : 'bg-slate-50/30 dark:bg-slate-500/5 border-slate-100 dark:border-slate-500/20'
          )}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Overdue</p>
                <p className={cn(
                  'text-3xl font-black mt-1 leading-none',
                  overdueTasks.length > 0 ? 'text-red-500' : ''
                )}>
                  {overdueTasks.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/20" />
            </CardContent>
          </Card>
          <Card className="bg-purple-50/30 dark:bg-purple-500/5 border-purple-100 dark:border-purple-500/20 shadow-sm transition-all hover:shadow-md h-[90px] flex flex-col justify-center">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-widest">Avg Speed</p>
                <p className="text-3xl font-black mt-1 leading-none">{user.workload.avgCompletionTime}d</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500/20" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="w-full bg-accent/50 p-1 h-11 border">
            <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold tracking-tight">Activity</TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold tracking-tight">Tasks</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold tracking-tight">
                Notes
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Task Completion Heatmap</h4>
              <ActivityHeatmap userId={user.id} />
            </div>

            {user.elnUrl && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Electronic Lab Notebook</span>
                </div>
                <a 
                  href={user.elnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {user.elnUrl}
                </a>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {/* Alerts */}
            {(overdueTasks.length > 0 || blockedTasks.length > 0) && (
              <div className="space-y-2">
                {overdueTasks.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {overdueTasks.slice(0, 3).map(task => (
                        <p key={task.id} className="text-sm text-muted-foreground truncate">
                          {task.title}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {blockedTasks.length > 0 && (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        {blockedTasks.length} blocked task{blockedTasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active Tasks */}
            <div>
              <h4 className="text-sm font-medium mb-2">Active Tasks ({activeTasks.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeTasks.slice(0, 10).map(task => (
                  <div key={task.id} className="p-2 rounded-lg bg-muted/50 text-sm">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
                      {task.dueDate && (
                        <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      )}
                    </div>
                  </div>
                ))}
                {activeTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No active tasks</p>
                )}
              </div>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="notes" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Private notes visible only to leadership team.
              </p>

              {/* Existing Notes */}
              <div className="space-y-3">
                {leadershipNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No leadership notes yet.
                  </p>
                ) : (
                  leadershipNotes.map(note => {
                    const author = users.find(u => u.id === note.authorId);
                    return (
                      <div key={note.id} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">
                              {author ? getInitials(author.name) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{author?.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a private leadership note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddNote} 
                  disabled={!newNote.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
