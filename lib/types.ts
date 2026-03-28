export type UserRole = 'admin' | 'lead' | 'member' | 'stakeholder';
export type Department = string;
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'review' | 'done';
export type ProjectStatus = 'active' | 'on-hold' | 'at-risk' | 'completed';

export interface User {
  id: string;
  name: string;
  full_name?: string; // For DB compatibility
  email: string;
  password?: string;
  role: UserRole;
  department: Department;
  skills: string[];
  weeklyCapacityHours: number;
  avatar?: string;
  workload: {
    activeTasks: number;
    completedThisWeek: number;
    overdueTasks: number;
    avgCompletionTime: number; // in days
  };
  elnUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  joinedDate: string;
  lastActive: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeIds: string[];
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

export interface TaskLog {
  id: string;
  userId: string;
  userName: string;
  content: string; // "how it was done"
  hoursLogged: number;
  logDate: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeIds: string[];
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  completedDate?: string;
  subtasks: Subtask[];
  comments: Comment[];
  logs: TaskLog[];
  summary?: string; // Employee-provided summary
  dependencies?: string[]; // Task IDs that block this task
  blockedBy?: string[]; // Task IDs that block this task (alias)
  blockedReason?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number; // 0-100 progress percentage
  reviewerId?: string;
  approvedBy?: string; // User ID of the person who approved it
  workflowId?: string; // Link to a Workflow template
  currentWorkflowStep?: string; // Current step name from the workflow
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  // Accountability
  autoEscalate: boolean;
  escalationThreshold: number;
  requireBlockerReason: boolean;
  mandatoryUpdates: boolean;
  updateFrequency: string;
  trackTimeEstimates: boolean;
  showVelocityMetrics: boolean;
  
  // Notifications
  emailNotifications: boolean;
  slackNotifications: boolean;
  taskAssigned: boolean;
  taskDueSoon: boolean;
  taskOverdue: boolean;
  mandatoryEmailOnDueDate: boolean;
  dailyOverdueReminders: boolean;
  projectUpdates: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  
  // Team
  defaultAssignee: string;
  workloadBalancing: boolean;
  maxTasksPerPerson: number;
  requireReviewer: boolean;
  crossFunctionalVisibility: boolean;
  
  // Workflow
  autoArchiveCompleted: boolean;
  archiveAfterDays: number;
  requireDueDate: boolean;
  requirePriority: boolean;
  enableDependencies: boolean;
  enableSubtasks: boolean;
  enableTimeTracking: boolean;
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
  externalLinks: {
    id: string;
    title: string;
    url: string;
    userId: string;
    type: 'eln' | 'other';
    createdAt: string;
  }[];
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

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: string[]; // e.g., ["Protocol Design", "Lab Execution", "Data Analysis", "Final Review"]
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  requesterId: string;
  approverId: string;
  type: 'workflow_step' | 'task_completion' | 'time_log';
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  workflowStep?: string; // If related to a specific workflow step
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface CapacitySnapshot {
  id: string;
  userId: string;
  weekStart: string;
  allocatedHours: number;
  status: 'normal' | 'overloaded';
  createdAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  fileUrl: string;
  version: number;
  tags: string[];
  accessLevel: 'all' | 'lead' | 'admin';
  status: 'pending' | 'approved' | 'archived';
  isPublished: boolean;
  publishedAt?: string;
  publishedBy?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface PortalComment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  fileUrl: string;
  version: number;
  uploadedBy: string;
  createdAt: string;
}

export interface PublishedReport {
  id: string;
  projectId: string;
  documentId: string;
  version: number;
  name: string;
  content: {
    name: string;
    version: number;
    file_url: string;
    projectName: string;
    tags: string[];
    published_at: string;
  };
  file_url: string;
  published_at: string;
  published_by: string;
}

export interface StakeholderFeedback {
  id: string;
  reportId: string;
  userId: string;
  content: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'delayed';
  createdBy: string;
  createdAt: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskDependency {
  id: string;
  predecessorTaskId: string;
  successorTaskId: string;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  eventType: string;
  enabled: boolean;
  delivery: 'instant' | 'digest' | 'both';
  channels: string[]; // 'email' | 'slack' | 'discord'
}

export interface NotificationLog {
  id: string;
  recipientId: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  subject: string;
  deliveredAt: string;
  deliveryMode: string; // 'email' | 'slack' | 'discord' (was 'instant' | 'digest')
}
