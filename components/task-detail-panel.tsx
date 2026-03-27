'use client';

import { useState } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  MessageSquare, 
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
  Shield,
  Layers,
  History
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp, useTask, useProject, useUsers, useCurrentUser } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { priorityColors, statusColors } from '@/lib/mock-data';
import { Priority, TaskStatus, Subtask } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TaskDetailPanel() {
  const { selectedTaskId, setSelectedTaskId, updateTask, addTaskComment, addTaskLog, deleteTask, settings, notifyAssignees } = useApp();
  const task = useTask(selectedTaskId || undefined);
  const project = useProject(task?.projectId);
  const users = useUsers();
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [bulkSubtasks, setBulkSubtasks] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  
  const [logContent, setLogContent] = useState('');
  const [logHours, setLogHours] = useState('');
  const [showLogForm, setShowLogForm] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!task) return null;

  const assignees = users.filter(u => task.assigneeIds.includes(u.id));

  const handleStatusChange = async (status: TaskStatus) => {
    if (status === 'done') {
      if (settings.requireReviewer && !task.approvedBy && currentUser.role !== 'admin') {
        toast({
          title: "Approval Required",
          description: "This task must be approved by an Admin or Project Lead before completion.",
          variant: "destructive",
        });
        return;
      }
    }

    if (status === 'done' && currentUser.role !== 'admin' && !task.approvedBy) {
      toast({
        title: "Permission Denied",
        description: "Only Admins (YO/AR/SK) can close tasks directly.",
        variant: "destructive",
      });
      return;
    }
    await updateTask(task.id, { 
      status,
      completedDate: status === 'done' ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  const handleApprove = async () => {
    const isAdmin = currentUser.role === 'admin';
    const isLead = project?.leadId === currentUser.id;
    const isReviewer = task.reviewerId === currentUser.id;

    if (!isAdmin && !isLead && !isReviewer) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to approve this task.",
        variant: "destructive",
      });
      return;
    }

    await updateTask(task.id, { 
      approvedBy: currentUser.id,
      status: 'done',
      completedDate: new Date().toISOString().split('T')[0]
    });
    toast({
      title: "Task Approved",
      description: `Task has been approved by ${currentUser.name} and marked as complete.`,
    });
  };

  const handlePriorityChange = async (priority: Priority) => {
    await updateTask(task.id, { priority });
  };

  const toggleAssignee = async (userId: string) => {
    if (userId === 'unassigned') {
      await updateTask(task.id, { assigneeIds: [] });
      return;
    }
    
    const newIds = task.assigneeIds.includes(userId)
      ? task.assigneeIds.filter(id => id !== userId)
      : [...task.assigneeIds, userId];
    
    await updateTask(task.id, { assigneeIds: newIds }, { silent: true });
  };
  
  const assignTeam = async (department: string) => {
    const teamMembers = users.filter(u => u.department === department).map(u => u.id);
    const uniqueIds = Array.from(new Set([...task.assigneeIds, ...teamMembers]));
    await updateTask(task.id, { assigneeIds: uniqueIds }, { silent: true });
    toast({ 
      title: "Team Assigned", 
      description: `Added all members from ${department} to this task.` 
    });
  };

  const handleNotify = async () => {
    if (!task || task.assigneeIds.length === 0) return;
    setNotifying(true);
    await notifyAssignees(task.id, task.assigneeIds);
    setNotifying(false);
  };

  const handleAddLog = async () => {
    if (!logContent.trim() || !logHours) return;
    await addTaskLog(task.id, {
      content: logContent.trim(),
      hoursSpent: parseFloat(logHours)
    });
    setLogContent('');
    setLogHours('');
    setShowLogForm(false);
    toast({ title: "Progress Logged", description: "Your update has been stored." });
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    const subtask: Subtask = {
      id: `s${Math.random().toString(36).substring(2, 9)}`,
      title: newSubtask.trim(),
      completed: false,
      assigneeIds: [],
    };
    await updateTask(task.id, { subtasks: [...task.subtasks, subtask] });
    setNewSubtask('');
  };

  const handleBulkAddSubtasks = async () => {
    const titles = bulkSubtasks.split('\n').filter(t => t.trim());
    if (titles.length === 0) return;
    
    const newSubtasks: Subtask[] = titles.map(title => ({
      id: `s${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      completed: false,
      assigneeIds: [],
    }));
    
    await updateTask(task.id, { subtasks: [...task.subtasks, ...newSubtasks] });
    setBulkSubtasks('');
    setShowBulkAdd(false);
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const isLead = project?.leadId === currentUser.id;
    const isAssignee = task.assigneeIds.includes(currentUser.id);
    const isAdmin = currentUser.role === 'admin';

    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask && !subtask.completed) { // Trying to complete
      if (!isAdmin && !isLead && !isAssignee) {
        toast({
          title: "Permission Denied",
          description: "Only supervisors (Assignees/Project Lead) can close subtasks.",
          variant: "destructive",
        });
        return;
      }
    }

    const subtasks = task.subtasks.map(s => 
      s.id === subtaskId 
        ? { ...s, completed: !s.completed, completedDate: !s.completed ? new Date().toISOString().split('T')[0] : undefined }
        : s
    );
    await updateTask(task.id, { subtasks });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await updateTask(task.id, { subtasks: task.subtasks.filter(s => s.id !== subtaskId) });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addTaskComment(task.id, {
      userId: currentUser.id,
      content: newComment.trim(),
    });
    setNewComment('');
  };

  const handleDeleteTask = async () => {
    await deleteTask(task.id);
    setSelectedTaskId(null);
  };

  return (
    <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-0 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0">
                  {project?.name}
                </Badge>
                {task.actualHours && task.actualHours > 0 && (
                   <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold px-1.5 py-0">
                    {task.actualHours}h Logged
                   </Badge>
                )}
              </div>
              <SheetTitle className="text-xl font-black tracking-tight pr-8">{task.title}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status & Priority Row */}
          <div className="flex gap-3">
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={task.priority} onValueChange={handlePriorityChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignees */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Assignees
            </label>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {assignees.map(user => (
                <Badge key={user.id} variant="secondary" className="pl-1 pr-1 py-1 flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[8px]">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{user.name}</span>
                  <button 
                    onClick={() => toggleAssignee(user.id)}
                    className="ml-0.5 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {assignees.length === 0 && (
                <span className="text-sm text-muted-foreground italic">No one assigned</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select onValueChange={toggleAssignee}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add member..." />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => !task.assigneeIds.includes(u.id)).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2 text-xs">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px]">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                        <span className="text-muted-foreground opacity-60">({user.department})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {task.assigneeIds.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "h-10 px-3 gap-2 font-bold text-[10px] uppercase tracking-widest border-2 transition-all",
                    notifying ? "bg-muted" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
                  )}
                  onClick={handleNotify}
                  disabled={notifying}
                >
                  <Clock className={cn("h-3.5 w-3.5", notifying && "animate-spin")} />
                  {notifying ? "..." : "Notify"}
                </Button>
              )}

              {currentUser.role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 px-3 gap-2 font-bold text-[10px] uppercase tracking-widest border-2">
                      <Layers className="h-3.5 w-3.5" />
                      Team
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 font-bold text-[10px] uppercase tracking-widest">
                    <DropdownMenuItem onClick={() => assignTeam('AI')}>Assign AI Team</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => assignTeam('Mol Bio')}>Assign Mol Bio Team</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => assignTeam('Bioinfo')}>Assign Bioinfo Team</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => assignTeam('Leadership')}>Assign Leadership</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Reviewer */}
          {settings.requireReviewer && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                Reviewer
              </label>
              <Select value={task.reviewerId || 'unassigned'} onValueChange={(id) => updateTask(task.id, { reviewerId: id === 'unassigned' ? undefined : id })}>
                <SelectTrigger>
                  <SelectValue>
                    {task.reviewerId ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(users.find(u => u.id === task.reviewerId)?.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{users.find(u => u.id === task.reviewerId)?.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select a reviewer</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.filter(u => u.role === 'admin' || project?.leadId === u.id).map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                        <span className="text-muted-foreground text-xs">({user.role === 'admin' ? 'Admin' : 'Lead'})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Due Date
            </label>
            <Input
              type="date"
              value={task.dueDate || ''}
              onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
            />
          </div>

          {/* Approval Action */}
          {task.status === 'review' && !task.approvedBy && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Ready for Approval</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This task has been submitted for review. An Admin or the assigned Reviewer can approve it.
              </p>
              <Button onClick={handleApprove} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Approve & Mark Complete
              </Button>
            </div>
          )}

          {/* Approved By Badge */}
          {task.approvedBy && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Approved by {users.find(u => u.id === task.approvedBy)?.name}</span>
            </div>
          )}

          {/* Blocked Warning */}
          {task.status === 'blocked' && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-sm">Blocked</span>
              </div>
              {task.blockedReason && (
                <p className="text-sm text-muted-foreground mt-1">{task.blockedReason}</p>
              )}
            </div>
          )}

          <Separator />

          {/* Description & Employee Summary */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Description
              </label>
              <Textarea
                placeholder="Add a description..."
                value={task.description || ''}
                onChange={(e) => updateTask(task.id, { description: e.target.value })}
                rows={3}
                className="bg-accent/30 border-none resize-none focus-visible:ring-blue-500/30"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-dashed">
              <label className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>Employee Summary</span>
                <Badge variant="outline" className="text-[9px] border-blue-500/20 text-blue-500">Required</Badge>
              </label>
              <Textarea
                placeholder="Briefly explain what's done or pending..."
                value={task.summary || ''}
                onChange={(e) => updateTask(task.id, { summary: e.target.value })}
                rows={2}
                className="bg-blue-500/5 border-blue-500/10 resize-none font-medium italic text-sm"
              />
            </div>
          </div>

          <Separator />

          {/* Work Logs - NEW SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" />
                Work Discovery Logs
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] font-bold uppercase tracking-widest border-2 hover:bg-emerald-500 hover:text-white transition-all"
                onClick={() => setShowLogForm(!showLogForm)}
              >
                {showLogForm ? 'Cancel' : 'Log Hours'}
              </Button>
            </div>

            {showLogForm && (
              <Card className="p-3 bg-muted/30 border-2 border-dashed border-emerald-500/30 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Input 
                    placeholder="Hours" 
                    type="number" 
                    className="col-span-1 h-8 text-sm font-bold"
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                  />
                  <Input 
                    placeholder="What did you do?" 
                    className="col-span-2 h-8 text-sm"
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                  />
                </div>
                <Button className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-[10px] tracking-widest" onClick={handleAddLog}>
                  Save Progress Log
                </Button>
              </Card>
            )}

            <div className="space-y-2">
              {task.logs?.map(log => (
                <div key={log.id} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 space-y-1 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-500">{log.userName}</span>
                      <span className="text-[10px] text-muted-foreground/60">{new Date(log.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-none font-black">{log.hoursSpent}h</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{log.content}</p>
                </div>
              ))}
              {(!task.logs || task.logs.length === 0) && (
                <div className="text-center py-6 border-2 border-dashed rounded-xl opacity-30">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No logs yet</p>
                </div>
              )}
            </div>

            {/* Time Metrics Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-accent/50 border space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Total Duration</p>
                <p className="text-lg font-black">{Math.floor((new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60))}h <span className="text-xs font-medium text-muted-foreground">since creation</span></p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-600/60">Billable Effort</p>
                <p className="text-lg font-black text-blue-600">{task.actualHours || 0}h <span className="text-xs font-medium opacity-60">logged</span></p>
              </div>
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowBulkAdd(!showBulkAdd)}
              >
                {showBulkAdd ? 'Single Add' : 'Bulk Add'}
              </Button>
            </div>

            {/* Subtask List */}
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div 
                  key={subtask.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                >
                  <button
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className="shrink-0"
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <span className={cn(
                    'flex-1 text-sm',
                    subtask.completed && 'line-through text-muted-foreground'
                  )}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Subtask */}
            {showBulkAdd ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter subtasks (one per line)..."
                  value={bulkSubtasks}
                  onChange={(e) => setBulkSubtasks(e.target.value)}
                  rows={4}
                />
                <Button size="sm" onClick={handleBulkAddSubtasks}>
                  Add Subtasks
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
                <Button size="icon" onClick={handleAddSubtask}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Comments */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Comments ({task.comments.length})
            </label>

            <div className="space-y-3">
              {task.comments.map((comment) => {
                const author = users.find(u => u.id === comment.userId);
                return (
                  <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {author ? getInitials(author.name) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{author?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
              />
            </div>
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
              Add Comment
            </Button>
          </div>

          <Separator />

          {/* Danger Zone */}
          <div className="pt-4">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteTask}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
