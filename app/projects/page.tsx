'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  GripVertical,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useApp, useProjects, useTasksByProject, useUser, useUsers } from '@/lib/store';
import { useToast } from '@/components/ui/use-toast';
import { departmentColors, priorityColors, projectStatusColors, statusColors } from '@/lib/mock-data';
import { Project, Task, Priority, Department, ProjectStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

function TaskRow({ task, onSelect }: { task: Task; onSelect: () => void }) {
  const assignee = useUser(task.assigneeIds[0]);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'done';

  const statusIcon = {
    'todo': <Circle className="h-4 w-4 text-muted-foreground" />,
    'in-progress': <Clock className="h-4 w-4 text-blue-500" />,
    'blocked': <AlertTriangle className="h-4 w-4 text-destructive" />,
    'review': <Clock className="h-4 w-4 text-purple-500" />,
    'done': <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  };

  return (
    <div 
      className="flex items-center gap-2 p-2 pl-8 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
      onClick={onSelect}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
      {statusIcon[task.status]}
      <span className={cn(
        'flex-1 text-sm truncate',
        task.status === 'done' && 'line-through text-muted-foreground'
      )}>
        {task.title}
      </span>
      {task.subtasks.length > 0 && (
        <span className="text-xs text-muted-foreground">
          {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
        </span>
      )}
      <Badge variant="outline" className={cn('text-[10px] px-1.5', priorityColors[task.priority])}>
        {task.priority[0].toUpperCase()}
      </Badge>
      {task.dueDate && (
        <span className={cn(
          'text-xs',
          isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'
        )}>
          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
      {assignee && (
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px]">
            {getInitials(assignee.name)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function ProjectCard({ project }: ProjectCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkTasks, setBulkTasks] = useState('');
  
  const tasks = useTasksByProject(project.id);
  const lead = useUser(project.leadId);
  const users = useUsers();
  const { setSelectedTaskId, setSelectedProjectId, addTask, bulkAddTasks } = useApp();

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await addTask({
      title: newTaskTitle.trim(),
      projectId: project.id,
      priority: 'medium' as Priority,
      status: 'todo',
      assigneeIds: [],
      subtasks: [],
      comments: [],
      logs: [],
      tags: [],
      order: tasks.length,
    });
    setNewTaskTitle('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleBulkAdd = async () => {
    const titles = bulkTasks.split('\n').filter(t => t.trim());
    if (titles.length > 0) {
      await bulkAddTasks(project.id, titles);
      setBulkTasks('');
      setShowBulkAdd(false);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const memberAvatars = project.memberIds.slice(0, 3).map(id => users.find(u => u.id === id)).filter(Boolean);

  const getDaysRemaining = () => {
    if (!project.dueDate) return null;
    return Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">{project.name}</h3>
                <Badge variant="outline" className={cn('text-xs', departmentColors[project.department])}>
                  {project.department}
                </Badge>
                <Badge variant="outline" className={cn('text-xs', projectStatusColors[project.status])}>
                  {project.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{completedTasks}/{tasks.length} tasks</span>
                {daysRemaining !== null && (
                  <span className={cn(
                    'flex items-center gap-1',
                    daysRemaining < 0 ? 'text-destructive' : 
                    daysRemaining <= 7 ? 'text-warning' : ''
                  )}>
                    <Calendar className="h-3 w-3" />
                    {daysRemaining < 0 
                      ? `${Math.abs(daysRemaining)}d overdue`
                      : `${daysRemaining}d left`
                    }
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <Progress value={project.progress} className="h-2 flex-1" />
                <span className="text-xs font-medium w-8">{project.progress}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Member Avatars */}
              <div className="flex -space-x-2">
                {memberAvatars.map((user) => (
                  <Avatar key={user!.id} className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(user!.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.memberIds.length > 3 && (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{project.memberIds.length - 3}
                  </div>
                )}
              </div>

              {/* Notes Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedProjectId(project.id)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowBulkAdd(!showBulkAdd)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Bulk Add Tasks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedProjectId(project.id)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Notes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const event = new CustomEvent('edit-project', { detail: project });
                    window.dispatchEvent(event);
                  }}>Edit Project</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            {/* Bulk Add */}
            {showBulkAdd && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Bulk Add Tasks</p>
                <Textarea
                  placeholder="Enter tasks (one per line)..."
                  value={bulkTasks}
                  onChange={(e) => setBulkTasks(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkAdd}>
                    Add Tasks
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowBulkAdd(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Tasks */}
            <div className="space-y-1">
              {tasks.map((task) => (
                <TaskRow 
                  key={task.id} 
                  task={task} 
                  onSelect={() => setSelectedTaskId(task.id)}
                />
              ))}
            </div>

            {/* Inline Task Creation */}
            <div className="flex items-center gap-2 mt-2 pl-8">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Add a task and press Enter..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm border-dashed"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function ProjectsPage() {
  const projects = useProjects();
  const { addProject, updateProject, currentUser, departments } = useApp();
  const { toast } = useToast();
  const users = useUsers();
  const [filter, setFilter] = useState<'all' | 'active' | 'at-risk' | 'completed'>('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDept, setNewProjectDept] = useState<Department>('Mol Bio');
  const [newProjectPriority, setNewProjectPriority] = useState<Priority>('medium');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('active');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');

  // Listen for edit-project events from ProjectCard
  useEffect(() => {
    const handler = (e: Event) => {
      const project = (e as CustomEvent).detail as Project;
      setEditingProject(project);
      setNewProjectName(project.name);
      setNewProjectDesc(project.description || '');
      setNewProjectDept(project.department);
      setNewProjectPriority(project.priority);
      setNewProjectStatus(project.status);
      setNewProjectDueDate(project.dueDate || '');
      setShowNewProject(true);
    };
    window.addEventListener('edit-project', handler);
    return () => window.removeEventListener('edit-project', handler);
  }, []);

  const resetForm = () => {
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectDept('Mol Bio');
    setNewProjectPriority('medium');
    setNewProjectStatus('active');
    setNewProjectDueDate('');
    setEditingProject(null);
  };

  const handleSaveProject = async () => {
    if (!newProjectName.trim()) return;

    if (editingProject && newProjectStatus === 'completed' && currentUser.role !== 'admin') {
      toast({
        title: "Permission Denied",
        description: "Only Admins (YO/AR/SK) can close projects.",
        variant: "destructive",
      });
      return;
    }

    if (editingProject) {
      await updateProject(editingProject.id, {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        department: newProjectDept,
        priority: newProjectPriority,
        status: newProjectStatus,
        dueDate: newProjectDueDate || undefined,
      });
    } else {
      await addProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        department: newProjectDept,
        status: newProjectStatus,
        progress: 0,
        memberIds: [],
        elnLinks: [],
        comments: [],
        milestones: [],
        tags: [],
        priority: newProjectPriority,
        dueDate: newProjectDueDate || undefined,
      });
    }
    setShowNewProject(false);
    resetForm();
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'active') return p.status === 'active';
    if (filter === 'at-risk') return p.status === 'at-risk';
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage and track all research projects</p>
        </div>
        <Button onClick={() => { resetForm(); setShowNewProject(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* New/Edit Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={(open) => { setShowNewProject(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input
                placeholder="Enter project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Project description (optional)..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={newProjectDept} onValueChange={(v) => setNewProjectDept(v as Department)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newProjectPriority} onValueChange={(v) => setNewProjectPriority(v as Priority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newProjectStatus} onValueChange={(v) => setNewProjectStatus(v as ProjectStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newProjectDueDate}
                  onChange={(e) => setNewProjectDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowNewProject(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSaveProject} disabled={!newProjectName.trim()}>
                {editingProject ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'at-risk', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'all' ? 'All Projects' : f.replace('-', ' ')}
            <Badge variant="secondary" className="ml-2 text-xs">
              {f === 'all'
                ? projects.length
                : projects.filter(p => p.status === f).length
              }
            </Badge>
          </Button>
        ))}
      </div>

      {/* Project List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      )}
    </div>
  );
}
