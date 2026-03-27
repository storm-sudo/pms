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
    id: 'admin-ayush',
    name: 'Ayush Ranawade',
    email: 'ayushranawade002nt@gmail.com',
    password: 'ayush123',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'admin-sunil',
    name: 'Sunil Kapgate',
    email: 'sunilkapgate003nt@gmail.com',
    password: 'sunil123',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'admin-yogesh',
    name: 'Yogesh Ostwal',
    email: 'yogeshostwal001nt@gmail.com',
    password: 'yogesh123',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'admin-adwait',
    name: 'Adwait Joshi',
    email: 'adwaitjoshi004nt@gmail.com',
    password: 'adwait123',
    role: 'admin',
    department: 'Leadership',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
];

// Initial members
export const members: User[] = [
  {
    id: 'u-apurv',
    name: 'Apurv Kochar',
    email: 'apurvkochar005nt@gmail.com',
    password: 'apurv123',
    role: 'member',
    department: 'AI',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u-alok',
    name: 'Alok Ahirrao',
    email: 'alokahirrao008nt@gmail.com',
    password: 'alok123',
    role: 'member',
    department: 'AI',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u-suman',
    name: 'Sukhmandeep',
    email: 'sukhmandeep009nt@gmail.com',
    password: 'sukhmandeep123',
    role: 'member',
    department: 'AI',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u-shahebaaz',
    name: 'Shahebaaz Kazi',
    email: 'shahebaazkazi002nt@gmail.com',
    password: 'shahebaaz123',
    role: 'member',
    department: 'AI',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u-sayali',
    name: 'Sayali Chakre',
    email: 'sayalichakre007nt@gmail.com',
    password: 'sayali123',
    role: 'member',
    department: 'Mol Bio',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(1),
  },
  {
    id: 'u-rutuja',
    name: 'Rutuja Thul',
    email: 'rutujathul008nt@gmail.com',
    password: 'rutuja123',
    role: 'member',
    department: 'Mol Bio',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(2),
  },
  {
    id: 'u-aruna',
    name: 'Aruna Senthilkumar',
    email: 'arunasenthilkumar003NT@gmail.com',
    password: 'aruna123',
    role: 'member',
    department: 'Bioinfo',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u-prapti',
    name: 'Prapti Subhedar',
    email: 'praptisubhedar006nt@gmail.com',
    password: 'prapti123',
    role: 'member',
    department: 'Bioinfo',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(1),
  },
  {
    id: 'u-yashika',
    name: 'Yashika Bramhankar',
    email: 'yashikabramhankar005nt@gmail.com',
    password: 'yashika123',
    role: 'member',
    department: 'Bioinfo',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(2),
  },
  {
    id: 'u-darshana',
    name: 'Darshana Ghebad',
    email: 'darshanaghebad007nt@gmail.com',
    password: 'darshana123',
    role: 'member',
    department: 'Bioinfo',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
  {
    id: 'u-khushi',
    name: 'Khushi Rathi',
    email: 'khushirathi004nt@gmail.com',
    password: 'khushi123',
    role: 'member',
    department: 'Bioinfo',
    avatar: '',
    status: 'approved',
    workload: { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    joinedDate: '2024-01-01',
    lastActive: daysAgo(0),
  },
];

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

// Department colors (with fallback)
export const departmentColors: Record<string, string> = {
  'Mol Bio': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'AI': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'Bioinfo': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Leadership': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

export const getDepartmentColor = (dept: string) => {
  return departmentColors[dept] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
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
