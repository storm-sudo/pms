import { User, Project, Task, ActivityEntry, Department, Priority, TaskStatus, ProjectStatus } from './types';

// Generate dates relative to today
const today = new Date();
const daysAgo = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// Admin co-founders
export const admins: User[] = [
  {
    id: 'admin-0',
    name: 'System Administrator',
    email: 'shahebaazkazi002nt@gmail.com',
    password: 'dmin123',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u1',
    name: 'Ayush Ranawade',
    email: 'swati@nucleovir.com',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2023-01-15',
    lastActive: daysAgo(0),
  },
  {
    id: 'u2',
    name: 'Yogesh Ostwal',
    email: 'yogesh.ostwal@nucleovir.com',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2023-01-15',
    lastActive: daysAgo(0),
  },
  {
    id: 'u3',
    name: 'Sunil Kapgate',
    email: 'sunilkapgate@nucleovir.com',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2023-01-15',
    lastActive: daysAgo(1),
  },
];

// Initial members (Empty for production start)
export const members: User[] = [];

export const allUsers: User[] = [...admins, ...members];

// Projects (Empty for production start)
export const projects: Project[] = [];

// Tasks (Empty for production start)
export const tasks: Task[] = [];

// Generate activity data for heatmaps (365 days)
export function generateActivityData(userId: string): ActivityEntry[] {
  const activity: ActivityEntry[] = [];
  for (let i = 364; i >= 0; i--) {
    const date = daysAgo(i);
    activity.push({ date, count: 0 });
  }
  return activity;
}

// Quick filters 
export const defaultQuickFilters = [
  {
    id: 'qf1',
    name: 'My Tasks',
    filters: { assigneeIds: [] as string[] },
    isDefault: true,
  },
  {
    id: 'qf2',
    name: 'Critical & Overdue',
    filters: { priority: ['critical'] as Priority[], status: ['todo', 'in-progress', 'blocked'] as TaskStatus[] },
  },
  {
    id: 'qf3',
    name: 'Blocked Tasks',
    filters: { status: ['blocked'] as TaskStatus[] },
  },
];

// Department colors
export const departmentColors: Record<Department, string> = {
  'Mol Bio': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'AI': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'Bioinfo': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Leadership': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

export const priorityColors: Record<Priority, string> = {
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export const statusColors: Record<TaskStatus, string> = {
  todo: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'in-progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  blocked: 'bg-red-500/10 text-red-600 dark:text-red-400',
  review: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export const projectStatusColors: Record<ProjectStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'on-hold': 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  'at-risk': 'bg-red-500/10 text-red-600 dark:text-red-400',
  completed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
};
