export type UserRole = 'admin' | 'member';
export type Department = 'Mol Bio' | 'AI' | 'Bioinfo' | 'Leadership';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'review' | 'done';
export type ProjectStatus = 'active' | 'on-hold' | 'at-risk' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: Department;
  avatar?: string;
  workload: {
    activeTasks: number;
    completedThisWeek: number;
    overdueTasks: number;
    avgCompletionTime: number; // in days
  };
  elnUrl?: string;
  joinedDate: string;
  lastActive: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  dueDate?: string;
  completedDate?: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  isLeadershipNote?: boolean; // For private leadership notes
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  startDate?: string;
  completedDate?: string;
  subtasks: Subtask[];
  comments: Comment[];
  dependencies?: string[]; // Task IDs that block this task
  blockedBy?: string[]; // Task IDs that block this task (alias)
  blockedReason?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number; // 0-100 progress percentage
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  department: Department;
  status: ProjectStatus;
  progress: number; // 0-100
  color?: string; // Project color for timeline
  dueDate?: string;
  endDate?: string; // Alias for dueDate in timeline
  startDate?: string;
  leadId?: string;
  memberIds: string[];
  elnLinks: { userId: string; url: string }[];
  comments: Comment[];
  milestones: {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }[];
  tags: string[];
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  criticalTasks: number;
  unassignedTasks: number;
  atRiskProjects: number;
  teamWorkload: {
    userId: string;
    load: 'light' | 'normal' | 'heavy' | 'overloaded';
    lateTasks: number;
  }[];
}

// Additional customization types for high-agency teams
export interface SLA {
  id: string;
  name: string;
  responseTime: number; // in hours
  resolutionTime: number; // in hours
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: string;
  notes?: string;
}

export interface Blocker {
  id: string;
  taskId: string;
  type: 'dependency' | 'resource' | 'external' | 'technical';
  description: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface OKR {
  id: string;
  objective: string;
  keyResults: {
    id: string;
    description: string;
    target: number;
    current: number;
    unit: string;
  }[];
  ownerId: string;
  quarter: string;
  year: number;
}

export interface QuickFilter {
  id: string;
  name: string;
  filters: {
    status?: TaskStatus[];
    priority?: Priority[];
    department?: Department[];
    assigneeIds?: string[];
    dueDateRange?: { start: string; end: string };
    tags?: string[];
  };
  isDefault?: boolean;
}
