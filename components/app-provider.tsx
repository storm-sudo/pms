'use client';

import { useState, useCallback, useEffect, ReactNode } from 'react';
import { AppContext, AppState, initialState } from '@/lib/store';
import { User, Project, Task, Comment, AppSettings } from '@/lib/types';
import { logoutUser, getSession, getLoggedInUser } from '@/lib/auth';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // Restore session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      const loggedInUser = getLoggedInUser();
      if (loggedInUser) {
        const mappedUser: User = {
          id: loggedInUser.id,
          name: loggedInUser.name,
          email: loggedInUser.email,
          role: 'member', // Default role for new users
          department: 'Mol Bio',
          joinedDate: loggedInUser.createdAt,
          lastActive: new Date().toISOString(),
          workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
        };

        setState(s => {
          const existingUser = s.users.find(u => u.email.toLowerCase() === loggedInUser.email.toLowerCase());
          const finalUser = existingUser || mappedUser;
          const userExists = s.users.some(u => u.id === finalUser.id);
          const updatedUsers = userExists ? s.users : [...s.users, finalUser];

          return {
            ...s,
            isLoggedIn: true,
            currentUser: finalUser,
            users: updatedUsers
          };
        });
      } else {
        setState(s => ({ ...s, isLoggedIn: true }));
      }
    }
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
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: `t${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };
    setState(s => ({ ...s, tasks: [...s.tasks, newTask] }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(t =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  }, []);

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
      tags: [],
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
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
