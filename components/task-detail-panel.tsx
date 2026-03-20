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
  ChevronDown
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { priorityColors, statusColors } from '@/lib/mock-data';
import { Priority, TaskStatus, Subtask } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TaskDetailPanel() {
  const { selectedTaskId, setSelectedTaskId, updateTask, addTaskComment, deleteTask } = useApp();
  const task = useTask(selectedTaskId || undefined);
  const project = useProject(task?.projectId);
  const users = useUsers();
  const currentUser = useCurrentUser();
  
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [bulkSubtasks, setBulkSubtasks] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!task) return null;

  const assignee = users.find(u => u.id === task.assigneeId);

  const handleStatusChange = (status: TaskStatus) => {
    updateTask(task.id, { 
      status,
      completedDate: status === 'done' ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  const handlePriorityChange = (priority: Priority) => {
    updateTask(task.id, { priority });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTask(task.id, { assigneeId: assigneeId === 'unassigned' ? undefined : assigneeId });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask: Subtask = {
      id: `s${Math.random().toString(36).substring(2, 9)}`,
      title: newSubtask.trim(),
      completed: false,
    };
    updateTask(task.id, { subtasks: [...task.subtasks, subtask] });
    setNewSubtask('');
  };

  const handleBulkAddSubtasks = () => {
    const titles = bulkSubtasks.split('\n').filter(t => t.trim());
    if (titles.length === 0) return;
    
    const newSubtasks: Subtask[] = titles.map(title => ({
      id: `s${Math.random().toString(36).substring(2, 9)}`,
      title: title.trim(),
      completed: false,
    }));
    
    updateTask(task.id, { subtasks: [...task.subtasks, ...newSubtasks] });
    setBulkSubtasks('');
    setShowBulkAdd(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const subtasks = task.subtasks.map(s => 
      s.id === subtaskId 
        ? { ...s, completed: !s.completed, completedDate: !s.completed ? new Date().toISOString().split('T')[0] : undefined }
        : s
    );
    updateTask(task.id, { subtasks });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    updateTask(task.id, { subtasks: task.subtasks.filter(s => s.id !== subtaskId) });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addTaskComment(task.id, {
      userId: currentUser.id,
      content: newComment.trim(),
    });
    setNewComment('');
  };

  const handleDeleteTask = () => {
    deleteTask(task.id);
    setSelectedTaskId(null);
  };

  return (
    <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-0 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">{project?.name}</p>
              <SheetTitle className="text-lg font-semibold pr-8">{task.title}</SheetTitle>
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

          {/* Assignee */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Assignee
            </label>
            <Select value={task.assigneeId || 'unassigned'} onValueChange={handleAssigneeChange}>
              <SelectTrigger>
                <SelectValue>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignee.name}</span>
                      <span className="text-muted-foreground">({assignee.department})</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      <span className="text-muted-foreground text-xs">({user.department})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add a description..."
              value={task.description || ''}
              onChange={(e) => updateTask(task.id, { description: e.target.value })}
              rows={3}
            />
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
