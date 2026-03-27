"use client";

import { useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { AppContext, AppState, initialState } from '@/lib/store';
import { User, Project, Task, Comment, AppSettings, TaskStatus, Priority } from '@/lib/types';
import { logoutUser, getSession, loginUser as supabaseLogin } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';
import { toast as sonner } from 'sonner';
import { notificationService } from '@/lib/notifications';
import { supabaseService } from '@/lib/supabase-service';
import { supabase } from '@/lib/supabase';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // Initial data fetch and real-time setup
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profiles, depts, projects, tasks] = await Promise.all([
          supabaseService.getProfiles(),
          supabaseService.getDepartments(),
          supabaseService.getProjects(),
          supabaseService.getTasks()
        ]);

        setState(s => {
          const session = getSession();
          let currentUser = null;
          let isLoggedIn = false;

          if (session) {
            currentUser = profiles.find(u => u.id === session.userId) || null;
            isLoggedIn = !!currentUser;
          }

          return {
            ...s,
            users: profiles,
            departments: depts.length > 0 ? depts : s.departments,
            projects: projects,
            tasks: tasks,
            currentUser: (currentUser || s.currentUser) as User,
            isLoggedIn
          };
        });
      } catch (error) {
        console.error('Error fetching Supabase data:', error);
      }
    };

    fetchData();

    // Set up Real-time subscriptions
    const taskChannel = supabase.channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT') return { ...s, tasks: [...s.tasks, payload.new as Task] };
          if (payload.eventType === 'UPDATE') return { ...s, tasks: s.tasks.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t) };
          if (payload.eventType === 'DELETE') return { ...s, tasks: s.tasks.filter(t => t.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const projectChannel = supabase.channel('projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT') return { ...s, projects: [...s.projects, payload.new as Project] };
          if (payload.eventType === 'UPDATE') return { ...s, projects: s.projects.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p) };
          if (payload.eventType === 'DELETE') return { ...s, projects: s.projects.filter(p => p.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();
      
    const profileChannel = supabase.channel('profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const p = payload.new as any;
            const mappedUser: User = {
              ...p,
              joinedDate: p.joined_date,
              lastActive: p.last_active,
              avatar: p.avatar_url,
              approvedBy: p.approved_by,
              approvedAt: p.approved_at,
              workload: p.workload || { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
            };
            
            if (payload.eventType === 'INSERT') return { ...s, users: [...s.users, mappedUser] };
            return { ...s, users: s.users.map(u => u.id === p.id ? { ...u, ...mappedUser } : u) };
          }
          if (payload.eventType === 'DELETE') return { ...s, users: s.users.filter(u => u.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(profileChannel);
    };
  }, []);

  // Initialize theme from system preference or localStorage
  useEffect(() => {
    const stored = localStorage.getItem('synapse-theme');
    if (stored === 'light' || stored === 'dark') {
      setState(s => ({ ...s, theme: stored }));
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setState(s => ({ ...s, theme: prefersDark ? 'dark' : 'light' }));
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  // Report Scheduler
  useEffect(() => {
    const interval = setInterval(() => {
      notificationService.checkAndSendReports(state.tasks, state.projects, state.users);
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [state.tasks, state.projects, state.users]);

  const setCurrentUser = useCallback((user: User) => {
    setState(s => ({ ...s, currentUser: user }));
  }, []);

  const setLoggedIn = useCallback((loggedIn: boolean) => {
    setState(s => ({ ...s, isLoggedIn: loggedIn }));
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setState(s => ({ ...s, isLoggedIn: false }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { success, user, error } = await supabaseLogin(email, password);
    if (success && user) {
      // Map user fields for state consistency
      const mappedUser: User = {
        ...user,
        joinedDate: user.joined_date,
        lastActive: user.last_active,
        avatar: user.avatar_url,
        workload: user.workload || { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
      };
      setState(s => ({ ...s, currentUser: mappedUser, isLoggedIn: true }));
      return true;
    }
    if (error) {
      toast({
        title: 'Login Error',
        description: error,
        variant: 'destructive'
      });
    }
    return false;
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState(s => ({ ...s, theme }));
    localStorage.setItem('synapse-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggleTheme = useCallback(() => {
    setState(s => {
      const newTheme = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('synapse-theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return { ...s, theme: newTheme };
    });
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setState(s => ({ ...s, sidebarCollapsed: collapsed }));
  }, []);

  const setSelectedTaskId = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedTaskId: id }));
  }, []);

  const setSelectedProjectId = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedProjectId: id }));
  }, []);

  const setSelectedUserId = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedUserId: id }));
  }, []);

  // Task actions
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, options?: { silent?: boolean }) => {
    try {
      const newTask = await supabaseService.addTask({
        ...task,
        subtasks: [],
        comments: [],
        logs: [],
        summary: '',
        order: 0,
      });
      
      const silent = options?.silent ?? false;

      // Notify new assignees
      if (newTask.assigneeIds.length > 0 && !silent) {
        const project = state.projects.find(p => p.id === newTask.projectId);
        const assignees = state.users.filter(u => newTask.assigneeIds.includes(u.id));
        if (project) {
          notificationService.notifyTaskAssignment(newTask, project, assignees, state.currentUser);
        }
      }

      toast({
        title: 'Task Created',
        description: `"${newTask.title}" has been added successfully.`,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({ title: 'Error', description: 'Failed to create task.', variant: 'destructive' });
    }
  }, [state.projects, state.users, state.currentUser]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      await supabaseService.updateTask(id, updates);
      
      if (updates.assigneeIds && !silent) {
        const oldTask = state.tasks.find(t => t.id === id);
        const newAssigneeIds = updates.assigneeIds.filter(userId => !oldTask?.assigneeIds.includes(userId));
        
        if (newAssigneeIds.length > 0) {
          const task = state.tasks.find(t => t.id === id);
          if (task) {
            const project = state.projects.find(p => p.id === task.projectId);
            const assignees = state.users.filter(u => newAssigneeIds.includes(u.id));
            if (project) {
              notificationService.notifyTaskAssignment({ ...task, ...updates }, project, assignees, state.currentUser);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task.', variant: 'destructive' });
    }
  }, [state.tasks, state.projects, state.users, state.currentUser]);

  const notifyAssignees = useCallback((taskId: string, userIds: string[]) => {
    const task = state.tasks.find(t => t.id === taskId);
    const project = state.projects.find(p => p.id === task?.projectId);
    const assignees = state.users.filter(u => userIds.includes(u.id));
    
    if (task && project && assignees.length > 0) {
      notificationService.notifyTaskAssignment(task, project, assignees, state.currentUser);
      sonner.success('Email sent to employees', {
        description: `Alerted ${assignees.length} members about "${task.title}".`,
      });
    }
  }, [state.tasks, state.projects, state.users, state.currentUser]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await supabaseService.deleteTask(id);
      toast({ title: 'Task Deleted', description: 'Task removed successfully.' });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: 'Failed to delete task.', variant: 'destructive' });
    }
  }, []);

  const addTaskComment = useCallback(async (taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    try {
      await supabaseService.addComment({
        task_id: taskId,
        user_id: comment.userId,
        content: comment.content,
        is_leadership_note: comment.isLeadershipNote,
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, []);

  const bulkAddTasks = useCallback(async (projectId: string, titles: string[]) => {
    try {
      const projectTasks = state.tasks.filter(t => t.projectId === projectId);
      const maxOrder = projectTasks.length > 0 ? Math.max(...projectTasks.map(t => t.order)) : 0;

      for (let i = 0; i < titles.length; i++) {
        await supabaseService.addTask({
          projectId,
          title: titles[i].trim(),
          priority: 'medium',
          status: 'todo',
          order: maxOrder + i + 1,
        });
      }
    } catch (error) {
      console.error('Error bulk adding tasks:', error);
    }
  }, [state.tasks]);

  const reorderTasks = useCallback(async (projectId: string, taskIds: string[]) => {
    try {
      // For each task, update its order in Supabase
      // Optimization: We could use a RPC call here, but for now we'll do it sequentially
      for (let i = 0; i < taskIds.length; i++) {
        await supabaseService.updateTask(taskIds[i], { order: i });
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  }, []);

  // Project actions
  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await supabaseService.addProject(project);
      toast({ title: 'Project Created', description: `"${project.name}" has been added successfully.` });
    } catch (error) {
      console.error('Error adding project:', error);
      toast({ title: 'Error', description: 'Failed to create project.', variant: 'destructive' });
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      await supabaseService.updateProject(id, updates);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({ title: 'Error', description: 'Failed to update project.', variant: 'destructive' });
    }
  }, []);

  const addProjectComment = useCallback(async (projectId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    try {
      await supabaseService.addComment({
        project_id: projectId,
        user_id: comment.userId,
        content: comment.content,
        is_leadership_note: comment.isLeadershipNote,
      });
    } catch (error) {
      console.error('Error adding project comment:', error);
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      await supabaseService.updateProfile(id, updates);
      toast({ title: 'Profile Updated', description: 'User metadata salvaged to database.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } }));
  }, []);

  const approveUser = useCallback(async (userId: string) => {
    try {
      await supabaseService.updateProfile(userId, { 
        status: 'approved', 
        approved_by: state.currentUser.id, 
        approved_at: new Date().toISOString() 
      });
      
      const user = state.users.find(u => u.id === userId);
      if (user) {
        notificationService.sendEmail(
          user.email,
          'SYNAPSE: Account Approved',
          `Dear ${user.name.split(' ')[0]}, your account has been approved. You can now log in to the portal.`
        );
        toast({ title: 'User Approved', description: `${user.name} now has access.` });
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast({ title: 'Error', description: 'Failed to approve user.', variant: 'destructive' });
    }
  }, [state.users, state.currentUser]);

  const rejectUser = useCallback(async (userId: string) => {
    try {
      // In a real app, we might just mark as 'rejected' or delete
      // For now, let's delete to match the original logic
      const user = state.users.find(u => u.id === userId);
      await supabase.from('profiles').delete().eq('id', userId);
      
      if (user) {
        notificationService.sendEmail(
          user.email,
          'SYNAPSE: Account Registration Update',
          `Dear ${user.name.split(' ')[0]}, your registration request could not be approved at this time.`
        );
        toast({ title: 'User Rejected', description: `${user.name} has been removed.` });
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({ title: 'Error', description: 'Failed to reject user.', variant: 'destructive' });
    }
  }, [state.users]);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'joinedDate' | 'lastActive' | 'workload' | 'status'> & { password?: string }) => {
    try {
      // 1. Create the user in profiles (In a real system, we'd use Supabase Auth)
      const id = crypto.randomUUID(); // Use UUID for Supabase
      const now = new Date().toISOString();
      
      const dbProfile = {
        id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        status: 'approved',
        joined_date: now,
        last_active: now,
      };

      const { error } = await supabase.from('profiles').insert([dbProfile]);
      if (error) throw error;

      notificationService.sendEmail(
        userData.email,
        'SYNAPSE: Account Created',
        `Dear ${userData.name.split(' ')[0]}, your account has been created by an administrator.<br><br>
        <strong>Login Details:</strong><br>
        Email: ${userData.email}<br>
        Password: ${userData.password || 'dmin123'}<br><br>
        You can now log in to the portal.`
      );

      toast({ title: 'User Created', description: `${userData.name} has been added to the team.` });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({ title: 'Error', description: 'Failed to add user.', variant: 'destructive' });
    }
  }, []);
  
  const addDepartment = useCallback(async (name: string) => {
    try {
      await supabaseService.addDepartment(name);
      sonner.success('Department Added', {
        description: `"${name}" is now available across the portal.`,
      });
    } catch (error) {
      console.error('Error adding department:', error);
      toast({ title: 'Error', description: 'Failed to add department.', variant: 'destructive' });
    }
  }, []);

  const addTaskLog = useCallback(async (taskId: string, log: { content: string; hoursSpent: number }) => {
    try {
      const now = new Date().toISOString();
      await supabaseService.addTaskLog({
        task_id: taskId,
        user_id: state.currentUser.id,
        content: log.content,
        hours_spent: log.hoursSpent,
      });

      // Update task actual hours
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        await supabaseService.updateTask(taskId, {
          actualHours: (task.actualHours || 0) + log.hoursSpent,
        });
      }
    } catch (error) {
      console.error('Error adding task log:', error);
    }
  }, [state.currentUser, state.tasks]);

  const contextValue = {
    ...state,
    setCurrentUser,
    setLoggedIn,
    logout,
    login,
    setTheme,
    toggleTheme,
    setSidebarCollapsed,
    setSelectedTaskId,
    setSelectedProjectId,
    setSelectedUserId,
    addTask,
    updateTask,
    deleteTask,
    addTaskComment,
    bulkAddTasks,
    reorderTasks,
    addProject,
    updateProject,
    updateUser,
    addProjectComment,
    updateSettings,
    approveUser,
    rejectUser,
    addUser,
    addTaskLog,
    addDepartment,
    notifyAssignees,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
