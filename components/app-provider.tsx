'use client';

import { useState, useCallback, useEffect, ReactNode } from 'react';
import { AppContext, AppState, initialState } from '@/lib/store';
import { User, Project, Task, Comment, AppSettings, TaskStatus, Priority } from '@/lib/types';
import { logoutUser, getSession, getLoggedInUser, registerUserByAdmin } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';
import { notificationService } from '@/lib/notifications';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // Restore session and users on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Get users from localStorage
    const storageData = localStorage.getItem('synapse-registered-users');
    const registeredUsers: any[] = storageData ? JSON.parse(storageData) : [];

    const mappedUsers: User[] = registeredUsers.map(ru => ({
      id: ru.id,
      name: ru.name,
      email: ru.email,
      role: 'member',
      department: 'Mol Bio',
      status: ru.status || 'pending',
      joinedDate: ru.createdAt,
      lastActive: new Date().toISOString(),
      workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
    }));

    setState(s => {
      // Start with all initial users from mock-data/initialState
      const allMergedUsers = [...s.users];

      // Add any additional users from localStorage that aren't already present
      mappedUsers.forEach(mu => {
        if (!allMergedUsers.some(u => u.email.toLowerCase() === mu.email.toLowerCase())) {
          allMergedUsers.push(mu);
        }
      });

      // Handle current session
      const session = getSession();
      let currentUser = null;
      let isLoggedIn = false;

      if (session) {
        currentUser = allMergedUsers.find(u => u.id === session.userId) || null;
        isLoggedIn = !!currentUser;
      }

      return {
        ...s,
        users: allMergedUsers,
        currentUser: currentUser as User,
        isLoggedIn
      };
    });
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

  const login = useCallback((email: string, password: string) => {
    const user = state.users.find(u => u.email === email && u.password === password);
    if (user) {
      if (user.status !== 'approved') {
        toast({
          title: 'Account Pending Approval',
          description: 'Your account has not been approved by an administrator yet.',
          variant: 'destructive'
        });
        return false;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('synapse-session', JSON.stringify({ userId: user.id, email: user.email }));
      }
      setState(s => ({ ...s, currentUser: user, isLoggedIn: true }));
      return true;
    }
    return false;
  }, [state.users]);

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
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, options?: { silent?: boolean }) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      subtasks: [],
      comments: [],
      logs: [],
      summary: '',
      order: 0,
      id: `t${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };
    setState(s => ({ ...s, tasks: [...s.tasks, newTask] }));
    
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
  }, [state.projects, state.users, state.currentUser]);

  const updateTask = useCallback((id: string, updates: Partial<Task>, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    setState(s => {
      const oldTask = s.tasks.find(t => t.id === id);
      const newTask = oldTask ? { ...oldTask, ...updates, updatedAt: new Date().toISOString() } : null;
      
      if (newTask && updates.assigneeIds && !silent) {
        // Find newly added assignees
        const newAssigneeIds = updates.assigneeIds.filter(id => !oldTask?.assigneeIds.includes(id));
        if (newAssigneeIds.length > 0) {
          const project = s.projects.find(p => p.id === newTask.projectId);
          const assignees = s.users.filter(u => newAssigneeIds.includes(u.id));
          if (project) {
            notificationService.notifyTaskAssignment(newTask, project, assignees, s.currentUser);
          }
        }
      }

      return {
        ...s,
        tasks: s.tasks.map(t => t.id === id ? newTask! : t),
      };
    });
  }, []);

  const notifyAssignees = useCallback((taskId: string, userIds: string[]) => {
    const task = state.tasks.find(t => t.id === taskId);
    const project = state.projects.find(p => p.id === task?.projectId);
    const assignees = state.users.filter(u => userIds.includes(u.id));
    
    if (task && project && assignees.length > 0) {
      notificationService.notifyTaskAssignment(task, project, assignees, state.currentUser);
      toast({
        title: 'Notifications Sent',
        description: `Alerted ${assignees.length} members about "${task.title}".`,
      });
    }
  }, [state.tasks, state.projects, state.users, state.currentUser]);

  const deleteTask = useCallback((id: string) => {
    setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id) }));
  }, []);

  const addTaskComment = useCallback((taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const newComment: Comment = {
      ...comment,
      id: `c${generateId()}`,
      createdAt: new Date().toISOString(),
    };
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t =>
        t.id === taskId
          ? { ...t, comments: [...t.comments, newComment], updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  }, []);

  const bulkAddTasks = useCallback((projectId: string, titles: string[]) => {
    const now = new Date().toISOString();
    const projectTasks = state.tasks.filter(t => t.projectId === projectId);
    const maxOrder = projectTasks.length > 0 ? Math.max(...projectTasks.map(t => t.order)) : 0;

    const newTasks: Task[] = titles.map((title, idx) => ({
      id: `t${generateId()}`,
      title: title.trim(),
      projectId,
      priority: 'medium' as const,
      status: 'todo' as const,
      subtasks: [],
      comments: [],
      logs: [],
      summary: '',
      tags: [],
      assigneeIds: [],
      order: maxOrder + idx + 1,
      createdAt: now,
      updatedAt: now,
    }));

    setState(s => ({ ...s, tasks: [...s.tasks, ...newTasks] }));
  }, [state.tasks]);

  const reorderTasks = useCallback((projectId: string, taskIds: string[]) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t => {
        if (t.projectId !== projectId) return t;
        const newOrder = taskIds.indexOf(t.id);
        if (newOrder === -1) return t;
        return { ...t, order: newOrder };
      }),
    }));
  }, []);

  // Project actions
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: `p${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };
    setState(s => ({ ...s, projects: [...s.projects, newProject] }));
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const addProjectComment = useCallback((projectId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    const newComment: Comment = {
      ...comment,
      id: `c${generateId()}`,
      createdAt: new Date().toISOString(),
    };
    setState(s => ({
      ...s,
      projects: s.projects.map(p =>
        p.id === projectId
          ? { ...p, comments: [...p.comments, newComment], updatedAt: new Date().toISOString() }
          : p
      ),
    }));
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setState(s => ({
      ...s,
      users: s.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } }));
  }, []);

  const approveUser = useCallback((userId: string) => {
    setState(s => {
      const user = s.users.find(u => u.id === userId);
      if (user) {
        const updatedUser: User = { 
          ...user, 
          status: 'approved', 
          approvedBy: s.currentUser.id, 
          approvedAt: new Date().toISOString() 
        };
        
        // Notify user via email
        notificationService.sendEmail(
          user.email,
          'SYNAPSE: Account Approved',
          `Dear ${user.name.split(' ')[0]}, your account has been approved. You can now log in to the portal.`
        );

        toast({ title: 'User Approved', description: `${user.name} now has access.` });

        return {
          ...s,
          users: s.users.map(u => u.id === userId ? updatedUser : u)
        };
      }
      return s;
    });
  }, []);

  const rejectUser = useCallback((userId: string) => {
    setState(s => {
      const user = s.users.find(u => u.id === userId);
      if (user) {
        // Notify user via email
        notificationService.sendEmail(
          user.email,
          'SYNAPSE: Account Registration Update',
          `Dear ${user.name.split(' ')[0]}, your registration request could not be approved at this time.`
        );

        toast({ title: 'User Rejected', description: `${user.name} has been removed.` });

        return {
          ...s,
          users: s.users.filter(u => u.id !== userId)
        };
      }
      return s;
    });
  }, []);

  const addUser = useCallback((userData: Omit<User, 'id' | 'joinedDate' | 'lastActive' | 'workload' | 'status'> & { password?: string }) => {
    const id = `user_${generateId()}`;
    const now = new Date().toISOString();
    
    const newUser: User = {
      ...userData,
      id,
      status: 'approved', // Admin created users are approved by default
      joinedDate: now,
      lastActive: now,
      workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
    };

    // 1. Add to auth storage
    registerUserByAdmin({
      id,
      name: newUser.name,
      email: newUser.email,
      password: userData.password || 'dmin123', // Default password
      status: 'approved',
      createdAt: now
    });

    // 2. Add to app state
    setState(s => ({ ...s, users: [...s.users, newUser] }));

    // 3. Notify user via email
    notificationService.sendEmail(
      newUser.email,
      'SYNAPSE: Account Created',
      `Dear ${newUser.name.split(' ')[0]}, your account has been created by an administrator.<br><br>
      <strong>Login Details:</strong><br>
      Email: ${newUser.email}<br>
      Password: ${userData.password || 'dmin123'}<br><br>
      You can now log in to the portal.`
    );

    toast({ title: 'User Created', description: `${newUser.name} has been added to the team.` });
  }, []);
  
  const addTaskLog = useCallback((taskId: string, log: { content: string; hoursSpent: number }) => {
    const id = `log_${generateId()}`;
    const now = new Date().toISOString();
    const newLog = {
      ...log,
      id,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      createdAt: now,
    };

    setState(s => ({
      ...s,
      tasks: s.tasks.map(t =>
        t.id === taskId
          ? { 
              ...t, 
              logs: [...(t.logs || []), newLog], 
              actualHours: (t.actualHours || 0) + log.hoursSpent,
              updatedAt: now 
            }
          : t
      ),
    }));
  }, [state.currentUser]);

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
    notifyAssignees,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
