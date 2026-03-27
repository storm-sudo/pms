'use client';

import { createContext, useContext } from 'react';
import { User, Project, Task, Comment, AppSettings } from './types';
import { allUsers, projects as initialProjects, tasks as initialTasks } from './mock-data';

export interface AppState {
  currentUser: User;
  isLoggedIn: boolean;
  users: User[];
  projects: Project[];
  tasks: Task[];
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  selectedUserId: string | null;
  settings: AppSettings;
}

export interface AppActions {
  setCurrentUser: (user: User) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
  login: (email: string, password: string) => boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedUserId: (id: string | null) => void;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, options?: { silent?: boolean }) => void;
  updateTask: (id: string, updates: Partial<Task>, options?: { silent?: boolean }) => void;
  notifyAssignees: (taskId: string, userIds: string[]) => void;
  deleteTask: (id: string) => void;
  addTaskComment: (taskId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  bulkAddTasks: (projectId: string, titles: string[]) => void;
  reorderTasks: (projectId: string, taskIds: string[]) => void;

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  addProjectComment: (projectId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  addUser: (user: Omit<User, 'id' | 'joinedDate' | 'lastActive' | 'workload' | 'status'> & { password?: string }) => void;
  addTaskLog: (taskId: string, log: { content: string; hoursSpent: number }) => void;
}

export type AppContextType = AppState & AppActions;

export const initialState: AppState = {
  currentUser: allUsers[0], // Swati (admin)
  isLoggedIn: false,
  users: allUsers,
  projects: initialProjects,
  tasks: initialTasks,
  theme: 'dark',
  sidebarCollapsed: false,
  selectedTaskId: null,
  selectedProjectId: null,
  selectedUserId: null,
  settings: {
    // Accountability
    autoEscalate: true,
    escalationThreshold: 24,
    requireBlockerReason: true,
    mandatoryUpdates: true,
    updateFrequency: 'daily',
    trackTimeEstimates: true,
    showVelocityMetrics: true,
    
    // Notifications
    emailNotifications: true,
    slackNotifications: true,
    taskAssigned: true,
    taskDueSoon: true,
    taskOverdue: true,
    mandatoryEmailOnDueDate: true,
    dailyOverdueReminders: true,
    projectUpdates: true,
    dailyDigest: true,
    weeklyReport: true,
    
    // Team
    defaultAssignee: 'auto',
    workloadBalancing: true,
    maxTasksPerPerson: 8,
    requireReviewer: true,
    crossFunctionalVisibility: true,
    
    // Workflow
    autoArchiveCompleted: true,
    archiveAfterDays: 7,
    requireDueDate: true,
    requirePriority: true,
    enableDependencies: true,
    enableSubtasks: true,
    enableTimeTracking: true,
  },
};

export const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// Helper hooks
export function useCurrentUser() {
  const { currentUser } = useApp();
  return currentUser;
}

export function useIsAdmin() {
  const { currentUser } = useApp();
  return currentUser.role === 'admin';
}

export function useProjects() {
  const { projects, currentUser } = useApp();
  if (currentUser.role === 'admin') return projects;
  return projects.filter(p => p.memberIds.includes(currentUser.id) || p.leadId === currentUser.id);
}

export function useTasks() {
  const { tasks, currentUser } = useApp();
  if (currentUser.role === 'admin') return tasks;
  
  // Members only see tasks in projects they belong to OR tasks assigned to them
  return tasks.filter(t => t.assigneeIds.includes(currentUser.id));
}

export function useTasksByProject(projectId: string) {
  const { tasks } = useApp();
  return tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
}

export function useMyTasks() {
  const { tasks, currentUser } = useApp();
  return tasks.filter(t => t.assigneeIds.includes(currentUser.id));
}

export function useUser(userId: string | undefined) {
  const { users } = useApp();
  return users.find(u => u.id === userId);
}

export function useUsers() {
  const { users } = useApp();
  return users;
}

export function useProject(projectId: string | undefined) {
  const { projects } = useApp();
  return projects.find(p => p.id === projectId);
}

export function useTask(taskId: string | undefined) {
  const { tasks } = useApp();
  return tasks.find(t => t.id === taskId);
}

// Dashboard stats
export function useDashboardStats() {
  const { tasks, projects, users } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const overdueTasks = tasks.filter(t =>
    t.status !== 'done' && t.dueDate && t.dueDate < today
  );

  const dueTodayTasks = tasks.filter(t =>
    t.status !== 'done' && t.dueDate === today
  );

  const criticalTasks = tasks.filter(t =>
    t.priority === 'critical' && t.status !== 'done'
  );

  const unassignedTasks = tasks.filter(t => t.assigneeIds.length === 0 && t.status !== 'done');

  const atRiskProjects = projects.filter(p => p.status === 'at-risk');

  const teamWorkload = users.filter(u => u.role === 'member').map(user => {
    const userTasks = tasks.filter(t => t.assigneeIds.includes(user.id) && t.status !== 'done');
    const lateTasks = userTasks.filter(t => t.dueDate && t.dueDate < today).length;
    const load = userTasks.length > 8 ? 'overloaded' :
      userTasks.length > 5 ? 'heavy' :
        userTasks.length > 2 ? 'normal' : 'light';
    return { userId: user.id, load, lateTasks, taskCount: userTasks.length };
  });

  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    overdueTasks,
    dueTodayTasks,
    criticalTasks,
    unassignedTasks,
    atRiskProjects,
    teamWorkload,
    blockedTasks: tasks.filter(t => t.status === 'blocked'),
  };
}
