import { supabase } from './supabase';
import { User, Project, Task, Comment, TaskLog } from './types';

export const supabaseService = {
  // Profiles/Users
  async getProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data.map((p: any) => ({
      ...p,
      joinedDate: p.joined_date,
      lastActive: p.last_active,
      avatar: p.avatar_url,
      approvedBy: p.approved_by,
      approvedAt: p.approved_at,
      workload: p.workload || { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
    }));
  },

  async updateProfile(id: string, updates: any) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
  },

  // Departments
  async getDepartments() {
    const { data, error } = await supabase.from('departments').select('name');
    if (error) throw error;
    return data.map(d => d.name);
  },

  async addDepartment(name: string) {
    const { error } = await supabase.from('departments').insert([{ name }]);
    if (error) throw error;
  },

  // Projects
  async getProjects() {
    const { data, error } = await supabase.from('projects').select('*');
    if (error) throw error;
    return data.map((p: any) => ({
      ...p,
      dueDate: p.due_date,
      leadId: p.lead_id,
      memberIds: p.member_ids || [],
      externalLinks: p.external_links || [],
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));
  },

  async addProject(project: any) {
    const dbProject = {
      name: project.name,
      description: project.description,
      department: project.department,
      status: project.status,
      progress: project.progress,
      priority: project.priority,
      due_date: project.dueDate,
      lead_id: project.leadId,
      member_ids: project.memberIds,
      external_links: project.externalLinks || []
    };
    const { data, error } = await supabase.from('projects').insert([dbProject]).select();
    if (error) throw error;
    return data[0];
  },

  async updateProject(id: string, updates: any) {
    const dbUpdates: any = { ...updates };
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.leadId) dbUpdates.lead_id = updates.leadId;
    if (updates.memberIds) dbUpdates.member_ids = updates.memberIds;
    if (updates.externalLinks) dbUpdates.external_links = updates.externalLinks;
    delete dbUpdates.dueDate;
    delete dbUpdates.leadId;
    delete dbUpdates.memberIds;
    delete dbUpdates.externalLinks;

    const { error } = await supabase.from('projects').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  // Tasks
  async getTasks() {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return data.map((t: any) => ({
      ...t,
      projectId: t.project_id,
      assigneeIds: t.assignee_ids || [],
      dueDate: t.due_date,
      order: t.task_order,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      subtasks: t.subtasks || [],
      comments: t.comments || [],
      logs: t.logs || []
    }));
  },

  async addTask(task: any) {
    const dbTask = {
      project_id: task.projectId,
      title: task.title,
      description: task.description,
      assignee_ids: task.assigneeIds,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate,
      tags: task.tags,
      task_order: task.order
    };
    const { data, error } = await supabase.from('tasks').insert([dbTask]).select();
    if (error) throw error;
    return data[0];
  },

  async updateTask(id: string, updates: any) {
    const dbUpdates: any = { ...updates };
    if (updates.projectId) dbUpdates.project_id = updates.projectId;
    if (updates.assigneeIds) dbUpdates.assignee_ids = updates.assigneeIds;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.order !== undefined) dbUpdates.task_order = updates.order;
    delete dbUpdates.projectId;
    delete dbUpdates.assigneeIds;
    delete dbUpdates.dueDate;
    delete dbUpdates.order;

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  // Task Logs
  async getTaskLogs(taskId: string) {
    const { data, error } = await supabase.from('task_logs').select('*').eq('task_id', taskId);
    if (error) throw error;
    return data;
  },

  async addTaskLog(log: any) {
    const { error } = await supabase.from('task_logs').insert([log]);
    if (error) throw error;
  },

  // Comments
  async getComments(taskId?: string, projectId?: string) {
    let query = supabase.from('comments').select('*');
    if (taskId) query = query.eq('task_id', taskId);
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async addComment(comment: any) {
    const { error } = await supabase.from('comments').insert([comment]);
    if (error) throw error;
  }
};
