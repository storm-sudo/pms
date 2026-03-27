'use client';

import { useState } from 'react';
import { 
  Users, 
  Search, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Plus
} from 'lucide-react';
import { useApp, useTasks, useUsers, useIsAdmin } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { statusColors } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';

export default function AdminTasksPage() {
  const { updateTask, projects, addTask, notifyAssignees } = useApp();
  const tasks = useTasks();
  const users = useUsers();
  const isAdmin = useIsAdmin();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  
  const [notifying, setNotifying] = useState(false);

  // Security check
  if (!isAdmin) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">This area is reserved for System Administrators only.</p>
          <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const selectedProject = projects.find(p => p.id === selectedTask?.projectId);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const toggleAssignee = (taskId: string, userId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newIds = task.assigneeIds.includes(userId)
      ? task.assigneeIds.filter(id => id !== userId)
      : [...task.assigneeIds, userId];
    
    updateTask(taskId, { assigneeIds: newIds }, { silent: true });
  };

  const assignTeam = (taskId: string, department: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const teamMembers = users.filter(u => u.department === department).map(u => u.id);
    const uniqueIds = Array.from(new Set([...task.assigneeIds, ...teamMembers]));
    
    updateTask(taskId, { assigneeIds: uniqueIds }, { silent: true });
    toast({ 
      title: "Team Assigned", 
      description: `Added all members from ${department} to "${task.title}".` 
    });
  };

  const clearAssignees = (taskId: string) => {
    updateTask(taskId, { assigneeIds: [] });
    toast({ title: "Assignees Cleared", description: "All members removed from the task." });
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    const projectId = newTaskProjectId || projects[0]?.id;
    if (!projectId) {
      toast({ title: "No Project Found", description: "Please create a project first.", variant: "destructive" });
      return;
    }

    addTask({
      title: newTaskTitle.trim(),
      projectId,
      priority: 'medium',
      status: 'todo',
      subtasks: [],
      comments: [],
      logs: [],
      summary: '',
      tags: [],
      assigneeIds: [],
      order: tasks.filter(t => t.projectId === projectId).length,
    }, { silent: true });
    
    setNewTaskTitle('');
    setNewTaskProjectId('');
    setCreateDialogOpen(false);
    toast({ title: "Task Created", description: "You can now assign and notify members below." });
  };

  const handleNotify = async () => {
    if (!selectedTask || selectedTask.assigneeIds.length === 0) return;
    
    setNotifying(true);
    await notifyAssignees(selectedTask.id, selectedTask.assigneeIds);
    setNotifying(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Admin Control Center</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Assign <span className="text-blue-600">Workload</span></h1>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 px-6 gap-2 bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20">
              <Plus className="h-4 w-4" />
              Create & Assign New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-widest text-sm text-blue-600">Initialize New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Task Title</label>
                <Input
                  placeholder="Task name..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Assign to Project</label>
                <Select value={newTaskProjectId || projects[0]?.id || ''} onValueChange={setNewTaskProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTask} className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] tracking-widest" disabled={!newTaskTitle.trim()}>
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Task Selection */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-2 shadow-xl shadow-blue-500/5 bg-background/50 backdrop-blur-xl">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-9 h-11 font-medium bg-muted/30 border-none focus-visible:ring-blue-500/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-2 space-y-1">
                  {filteredTasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const isSelected = selectedTaskId === task.id;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl transition-all duration-300 group relative overflow-hidden",
                          isSelected 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                            : "hover:bg-accent/50 border border-transparent hover:border-border"
                        )}
                      >
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-1">
                            <p className={cn(
                              "text-[9px] font-black uppercase tracking-widest",
                              isSelected ? "text-blue-100" : "text-muted-foreground"
                            )}>
                              {project?.name || 'General'}
                            </p>
                            <h3 className="font-bold text-sm leading-tight pr-4">{task.title}</h3>
                          </div>
                          <ArrowRight className={cn(
                            "h-4 w-4 transition-transform",
                            isSelected ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                          )} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: Assignment Dashboard */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTask ? (
            <Card className="border-2 shadow-2xl shadow-blue-500/10 border-blue-500/10 overflow-hidden min-h-[660px] animate-in slide-in-from-right-4 duration-500">
              <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />
              <CardHeader className="bg-muted/30 pb-6 pt-8">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-bold tracking-widest uppercase text-[10px] border-2">
                       {selectedProject?.name || 'No Project'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", statusColors[selectedTask.status as keyof typeof statusColors])} />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {selectedTask.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight pt-2">{selectedTask.title}</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-10">
                {/* Team Assignment Row */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                     <Layers className="h-4 w-4 text-blue-500" />
                     <h4 className="text-xs font-black uppercase tracking-[0.2em]">Bulk Team Assignment</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['AI', 'Mol Bio', 'Bioinfo', 'Leadership'].map(dept => (
                      <Button 
                        key={dept}
                        variant="outline" 
                        size="sm"
                        className="h-12 border-2 hover:border-blue-500 hover:bg-blue-500/5 font-bold uppercase text-[10px] tracking-widest group shadow-sm"
                        onClick={() => assignTeam(selectedTask.id, dept as any)}
                      >
                         Add {dept}
                         <UserPlus className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Individual Assignment */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <h4 className="text-xs font-black uppercase tracking-[0.2em]">Individual Members</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest gap-2 animate-in fade-in zoom-in"
                        onClick={handleNotify}
                        disabled={notifying || selectedTask.assigneeIds.length === 0}
                      >
                        <Clock className={cn("h-3 w-3", notifying && "animate-spin")} />
                        {notifying ? "Sending..." : "Notify All Assignees"}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[9px] font-bold text-destructive hover:text-white hover:bg-destructive uppercase tracking-widest"
                        onClick={() => clearAssignees(selectedTask.id)}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map(user => {
                      const isAssigned = selectedTask.assigneeIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => toggleAssignee(selectedTask.id, user.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 text-left group",
                            isAssigned 
                              ? "bg-blue-600/5 border-blue-500 shadow-sm" 
                              : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/30"
                          )}
                        >
                          <Avatar className={cn(
                            "h-10 w-10 border-2 transition-transform group-hover:scale-110",
                            isAssigned ? "border-blue-500 ring-2 ring-blue-500/20" : "border-border"
                          )}>
                            <AvatarFallback className="font-black text-xs">{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-black truncate", isAssigned ? "text-blue-600" : "text-foreground")}>
                              {user.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-60">
                              {user.department}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                  <div className="p-5 rounded-2xl bg-blue-600/5 border border-blue-500/10 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black uppercase tracking-tight">Assignment Control</h5>
                    <p className="text-xs text-muted-foreground font-medium">
                      Assignments are now silent. Click <span className="text-blue-600 font-bold">"Notify All Assignees"</span> above to send batch email alerts once your selection is final.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[600px] border-2 border-dashed rounded-3xl opacity-20">
              <ArrowRight className="h-12 w-12 mb-4" />
              <p className="text-xl font-black uppercase tracking-[0.3em]">Select Task</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
