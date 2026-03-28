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
  Tag,
  FlaskConical,
  Wrench,
  ChevronRight,
  Bell,
  Settings
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseService } from '@/lib/supabase-service';
import { NotificationPreference } from '@/lib/types';
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
import { Slider } from '@/components/ui/slider';
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
  const { selectedUserId, setSelectedUserId, updateUser, updateSkills, updateCapacity } = useApp();
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
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [editedCapacity, setEditedCapacity] = useState(40);
  const [newSkill, setNewSkill] = useState('');

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([]);
  const [wsSettings, setWsSettings] = useState<any>(null);
  const isMe = currentUser.id === user?.id;

  useEffect(() => {
    if (user?.id) {
        supabaseService.getNotificationPreferences(user.id).then(setNotificationPrefs);
        supabaseService.getWorkspaceSettings().then(setWsSettings).catch(() => {});
    }
  }, [user?.id]);

  const updatePreference = async (eventType: string, enabled: boolean, delivery: 'instant' | 'digest' | 'both', channels: string[] = ['email']) => {
    try {
        if (!user) return;
        await supabaseService.updateNotificationPreference(user.id, eventType, enabled, delivery, channels);
        setNotificationPrefs(prev => {
            if (!user) return prev;
            const index = prev.findIndex(p => p.eventType === eventType);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = { ...updated[index], enabled, delivery, channels };
                return updated;
            }
            return [...prev, { id: 'new', userId: user.id, eventType, enabled, delivery, channels }];
        });
    } catch (error) {
        console.error('Failed to update preference:', error);
    }
  };

  const toggleChannel = (eventType: string, channel: string) => {
    const pref = getPreference(eventType);
    const channels = pref.channels || ['email'];
    const newChannels = channels.includes(channel)
        ? channels.filter(c => c !== channel)
        : [...channels, channel];
    
    // Ensure at least one channel is selected if enabled
    if (newChannels.length === 0) return;
    updatePreference(eventType, pref.enabled, pref.delivery as any, newChannels);
  };

  const getPreference = (eventType: string) => {
    return notificationPrefs.find(p => p.eventType === eventType) || {
        enabled: true,
        delivery: ['approval_request_received', 'approval_resolved', 'researcher_overload', 'stakeholder_feedback_received'].includes(eventType) ? 'instant' : 'digest',
        channels: ['email']
    };
  };

  useEffect(() => {
    if (user) {
      setEditedName(user.name);
      setEditedDepartment(user.department);
      setEditedRole(user.role);
      setEditedEmail(user.email);
      setEditedSkills(user.skills || []);
      setEditedCapacity(user.weeklyCapacityHours || 40);
      setIsEditing(false);
    }
  }, [user]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!user) return null;

  const userTasks = user ? tasks.filter(t => t.assigneeIds.includes(user.id)) : [];
  const activeTasks = userTasks.filter(t => t.status !== 'done');
  const completedTasks = userTasks.filter(t => t.status === 'done');
  const today = new Date().toISOString().split('T')[0];
  const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate < today);
  const blockedTasks = activeTasks.filter(t => t.status === 'blocked');

  const handleAddNote = () => {
    if (!newNote.trim() || !user) return;
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
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto overflow-x-hidden">
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
            <TabsTrigger value="notifications" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold tracking-tight">
                Notifications
            </TabsTrigger>
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

            <Separator className="my-6" />

            {/* Sprint 2: Expertise & Capacity */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Expertise & Skills</h4>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold h-5">{user.skills.length} Technical Tags</Badge>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {user.skills.map(skill => (
                    <Badge key={skill} className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-bold">
                      {skill}
                      {isAdmin && (
                        <button 
                          className="ml-1.5 hover:text-emerald-900 cursor-pointer"
                          onClick={() => {
                            updateSkills(user.id, user.skills.filter(s => s !== skill));
                          }}
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                  {user.skills.length === 0 && (
                    <p className="text-xs italic text-muted-foreground">No laboratory expertises tagged.</p>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add laboratory skill (e.g. PCR, NGS)" 
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newSkill.trim()) {
                          updateSkills(user.id, [...user.skills, newSkill.trim()]);
                          setNewSkill('');
                        }
                      }}
                      className="h-9 text-xs"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => {
                        if (newSkill.trim()) {
                          updateSkills(user.id, [...user.skills, newSkill.trim()]);
                          setNewSkill('');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Weekly Capacity</h4>
                  </div>
                  <span className="text-sm font-black text-blue-600">{user.weeklyCapacityHours} Hours / Week</span>
                </div>
                
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Threshold Setting</span>
                     <Badge variant="outline" className="text-[10px] font-black h-4 px-1">{user.weeklyCapacityHours >= 50 ? 'OVERDRIVE' : 'NORMAL'}</Badge>
                   </div>
                   <Slider 
                     defaultValue={[user.weeklyCapacityHours]} 
                     max={80} 
                     step={1} 
                     disabled={!isAdmin}
                     onValueCommit={(vals) => {
                       updateCapacity(user.id, vals[0]);
                     }}
                     className="py-4"
                   />
                   <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                      <span>Low (10h)</span>
                      <span>Target (40h)</span>
                      <span>Max (80h)</span>
                   </div>
                </div>
              </div>
            </div>
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

          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <h4 className="text-lg font-black tracking-tight">Communication Preferences</h4>
            </div>
            <p className="text-xs text-muted-foreground bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                Configure how you receive laboratory updates. Medical-grade instant alerts are prioritized for clinical compliance, while task status changes are aggregated into the daily laboratory digest.
            </p>

            <div className="space-y-4">
               {[
                 { id: 'approval_request_received', label: 'Approval Requests', desc: 'When someone requests your research approval.' },
                 { id: 'approval_resolved', label: 'Approval Results', desc: 'When your request is approved or rejected.' },
                 { id: 'researcher_overload', label: 'Capacity Alerts', desc: 'When laboratory workload exceeds defined thresholds.' },
                 { id: 'task_status_changed', label: 'Task Assignments', desc: 'When you are assigned new research tasks.' },
                 { id: 'document_published', label: 'Document Releases', desc: 'When new protocols or SOPs are published.' },
                 { id: 'stakeholder_feedback_received', label: 'Stakeholder Input', desc: 'When feedback is received on published reports.' }
               ].map((pref) => {
                 const current = getPreference(pref.id);
                 return (
                   <div key={pref.id} className="flex flex-col gap-4 p-4 rounded-xl border bg-accent/10 hover:bg-accent/20 transition-all">
                     <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                         <Label className="text-sm font-black uppercase tracking-tight">{pref.label}</Label>
                         <p className="text-[10px] text-muted-foreground">{pref.desc}</p>
                       </div>
                       <Switch 
                         checked={current.enabled} 
                         disabled={!isMe && !isAdmin}
                         onCheckedChange={(val) => updatePreference(pref.id, val, current.delivery as any, current.channels)} 
                       />
                     </div>
                     
                     {current.enabled && (
                        <div className="space-y-4 pt-2 border-t border-dashed">
                            {/* Channel Selection */}
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Channels:</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`${pref.id}-email`} 
                                            checked={current.channels.includes('email')}
                                            onCheckedChange={() => toggleChannel(pref.id, 'email')}
                                        />
                                        <Label htmlFor={`${pref.id}-email`} className="text-[10px] font-bold">EMAIL</Label>
                                    </div>
                                    
                                    {wsSettings?.slack_enabled && (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`${pref.id}-slack`} 
                                                checked={current.channels.includes('slack')}
                                                onCheckedChange={() => toggleChannel(pref.id, 'slack')}
                                            />
                                            <Label htmlFor={`${pref.id}-slack`} className="text-[10px] font-bold">SLACK</Label>
                                        </div>
                                    )}

                                    {wsSettings?.discord_enabled && (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`${pref.id}-discord`} 
                                                checked={current.channels.includes('discord')}
                                                onCheckedChange={() => toggleChannel(pref.id, 'discord')}
                                            />
                                            <Label htmlFor={`${pref.id}-discord`} className="text-[10px] font-bold">DISCORD</Label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Strategy */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground">Delivery Strategy:</span>
                                <Select 
                                    value={current.delivery} 
                                    disabled={!isMe && !isAdmin}
                                    onValueChange={(val: any) => updatePreference(pref.id, current.enabled, val, current.channels)}
                                >
                                    <SelectTrigger className="h-7 text-[10px] font-black w-28 bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instant">Instant</SelectItem>
                                        <SelectItem value="digest">Digest</SelectItem>
                                        <SelectItem value="both">Both</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                     )}
                   </div>
                 );
               })}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
