import { supabase } from './supabase';
import { User, Project, Task, Comment, TaskLog, AuditLog, Milestone, ProjectPhase, TaskDependency } from './types';
import { addDays } from 'date-fns';

const logAudit = async (actorId: string, action: 'INSERT' | 'UPDATE' | 'DELETE', entityType: string, entityId: string, oldValue?: any, newValue?: any) => {
  const { error } = await supabase.from('audit_logs').insert([{
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue
  }]);
  if (error) console.error('Audit Log Error:', error);
};

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
      skills: p.skills || [],
      weeklyCapacityHours: p.weekly_capacity_hours || 40,
      approvedBy: p.approved_by,
      approvedAt: p.approved_at,
      workload: p.workload || { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 }
    }));
  },

  async updateProfile(id: string, updates: any, actorId: string) {
    const { data: oldData } = await supabase.from('profiles').select('*').eq('id', id).single();
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;
    await logAudit(actorId, 'UPDATE', 'profile', id, oldData, updates);
  },

  // Departments
  async getDepartments() {
    const { data, error } = await supabase.from('departments').select('name');
    if (error) throw error;
    return data.map(d => d.name);
  },

  async addDepartment(name: string, actorId: string) {
    const { data, error } = await supabase.from('departments').insert([{ name }]).select();
    if (error) throw error;
    if (data) await logAudit(actorId, 'INSERT', 'department', data[0].id || name, null, { name });
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
      updatedAt: p.updated_at,
      comments: p.comments || [],
      milestones: p.milestones || [],
      tags: p.tags || [],
      progress: p.progress || 0
    }));
  },

  async addProject(project: any, actorId: string) {
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
    await logAudit(actorId, 'INSERT', 'project', data[0].id, null, dbProject);
    return data[0];
  },

  async updateProject(id: string, updates: any, actorId: string) {
    const { data: oldData } = await supabase.from('projects').select('*').eq('id', id).single();
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
    await logAudit(actorId, 'UPDATE', 'project', id, oldData, dbUpdates);
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
      startDate: t.start_date,
      completedDate: t.completed_date,
      order: t.task_order,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      subtasks: t.subtasks || [],
      comments: t.comments || [],
      logs: t.logs || [],
      tags: t.tags || []
    }));
  },

  async addTask(task: any, actorId: string) {
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
    await logAudit(actorId, 'INSERT', 'task', data[0].id, null, dbTask);
    return data[0];
  },

  async updateTask(id: string, updates: any, actorId: string) {
    const { data: oldData } = await supabase.from('tasks').select('*').eq('id', id).single();
    const dbUpdates: any = { ...updates };
    if (updates.projectId) dbUpdates.project_id = updates.projectId;
    if (updates.assigneeIds) dbUpdates.assignee_ids = updates.assigneeIds;
    if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
    if (updates.order !== undefined) dbUpdates.task_order = updates.order;
    if (updates.workflowId) dbUpdates.workflow_id = updates.workflowId;
    if (updates.currentWorkflowStep) dbUpdates.current_workflow_step = updates.currentWorkflowStep;
    delete dbUpdates.projectId;
    delete dbUpdates.assigneeIds;
    delete dbUpdates.dueDate;
    delete dbUpdates.order;

    const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
    if (error) throw error;
    await logAudit(actorId, 'UPDATE', 'task', id, oldData, dbUpdates);
  },

  async deleteTask(id: string, actorId: string) {
    const { data: oldData } = await supabase.from('tasks').select('*').eq('id', id).single();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    await logAudit(actorId, 'DELETE', 'task', id, oldData, null);
  },

  // Task Logs
  async getTaskLogs(taskId: string) {
    const { data, error } = await supabase.from('task_logs').select('*').eq('task_id', taskId).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((l: any) => ({
      ...l,
      hoursLogged: l.hours_logged,
      logDate: l.log_date,
      approvalStatus: l.approval_status,
      approvedBy: l.approved_by
    }));
  },

  async addTaskLog(log: any, actorId: string) {
    const dbLog = {
      task_id: log.taskId,
      user_id: log.userId,
      user_name: log.userName,
      content: log.content,
      // DEPRECATED: hours_spent is kept for backward compatibility only.
      // Use hours_logged for all new enterprise features.
      hours_spent: 0, 
      hours_logged: log.hoursLogged || 0,
      log_date: log.logDate || new Date().toISOString().split('T')[0],
      approval_status: log.approvalStatus || 'pending'
    };
    const { data, error } = await supabase.from('task_logs').insert([dbLog]).select();
    if (error) throw error;
    await logAudit(actorId, 'INSERT', 'task_log', data[0].id, null, dbLog);
    return data[0];
  },

  async updateTaskLogStatus(logId: string, status: string, approverId: string, actorId: string) {
    const { data: oldData } = await supabase.from('task_logs').select('*').eq('id', logId).single();
    const updates = { approval_status: status, approved_by: approverId };
    const { error } = await supabase.from('task_logs').update(updates).eq('id', logId);
    if (error) throw error;
    await logAudit(actorId, 'UPDATE', 'task_log', logId, oldData, updates);
  },

  async getTimesheets(userId?: string, dateRange?: { start: string, end: string }) {
    let query = supabase.from('task_logs').select(`
      *,
      tasks:task_id (title, projects:project_id (name))
    `);
    if (userId) query = query.eq('user_id', userId);
    if (dateRange) {
      query = query.gte('log_date', dateRange.start).lte('log_date', dateRange.end);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data.map((l: any) => ({
      ...l,
      hoursLogged: l.hours_logged || l.hours_spent,
      projectName: l.tasks?.projects?.name || 'Unknown',
      taskTitle: l.tasks?.title || 'Unknown'
    }));
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

  async addComment(comment: any, actorId: string) {
    const { data, error } = await supabase.from('comments').insert([comment]).select();
    if (error) throw error;
    await logAudit(actorId, 'INSERT', 'comment', data[0].id, null, comment);
  },

  // Workflows
  async getWorkflows() {
    const { data, error } = await supabase.from('workflows').select('*');
    if (error) throw error;
    return data;
  },

  // Approval Requests
  async createApprovalRequest(request: any, actorId: string) {
    const dbRequest = {
      task_id: request.taskId,
      requester_id: request.requesterId,
      approver_id: request.approverId,
      type: request.type,
      workflow_step: request.workflowStep,
      status: 'pending'
    };
    const { data: res, error } = await supabase.from('approval_requests').insert([dbRequest]).select().single();
    if (error) throw error;

    // Notify Approver
    try {
        const { data: task } = await supabase.from('tasks').select('title, project_id').eq('id', request.taskId).single();
        const { data: project } = await supabase.from('projects').select('name').eq('id', task?.project_id).single();
        const { data: requester } = await supabase.from('profiles').select('name').eq('id', request.requesterId).single();

        if (task && project && requester) {
            const { notificationService } = await import('./notifications');
            await notificationService.sendNotification('approval_request_received', request.approverId, {
                entityId: res.id,
                entityType: 'approval_request',
                data: { 
                    title: task.title, 
                    projectName: project.name, 
                    requesterName: requester.name 
                }
            });
        }
    } catch (nError) {
        console.error('Non-blocking notification error:', nError);
    }

    await logAudit(actorId, 'INSERT', 'approval_request', res.id, null, dbRequest);
    return res;
  },

  async updateApprovalRequest(id: string, updates: any, actorId: string) {
    const { data: oldData } = await supabase.from('approval_requests').select('*').eq('id', id).single();
    const { error } = await supabase.from('approval_requests').update(updates).eq('id', id);
    if (error) throw error;

    // Notify Requester
    try {
        const { data: task } = await supabase.from('tasks').select('title').eq('id', oldData.task_id).single();
        const { data: approver } = await supabase.from('profiles').select('name').eq('id', actorId).single();

        if (task && approver) {
            const { notificationService } = await import('./notifications');
            await notificationService.sendNotification('approval_resolved', oldData.requester_id, {
                entityId: id,
                entityType: 'approval_request',
                data: {
                    title: task.title,
                    status: updates.status,
                    approverName: approver.name,
                    comment: updates.comment
                }
            });
        }
    } catch (nError) {
        console.error('Non-blocking notification error:', nError);
    }

    await logAudit(actorId, 'UPDATE', 'approval_request', id, oldData, updates);
  },

  async getApprovalRequests(taskId?: string) {
    let query = supabase.from('approval_requests').select('*');
    if (taskId) query = query.eq('task_id', taskId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((r: any) => ({
      ...r,
      taskId: r.task_id,
      requesterId: r.requester_id,
      approverId: r.approver_id,
      workflowStep: r.workflow_step
    }));
  },

  async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((l: any) => ({
      ...l,
      actorId: l.actor_id,
      entityType: l.entity_type,
      entityId: l.entity_id,
      oldValue: l.old_value,
      newValue: l.new_value,
      createdAt: l.created_at
    }));
  },

  async getCapacitySnapshots(userId?: string) {
    let query = supabase.from('capacity_snapshots').select('*').order('week_start', { ascending: true });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((s: any) => ({
      ...s,
      userId: s.user_id,
      weekStart: s.week_start,
      allocatedHours: s.allocated_hours,
      createdAt: s.created_at
    }));
  },

  async addCapacitySnapshot(snapshot: any, actorId: string) {
    const dbSnapshot = {
      user_id: snapshot.userId,
      week_start: snapshot.weekStart,
      allocated_hours: snapshot.allocatedHours,
      status: snapshot.status || 'normal'
    };
    const { data, error } = await supabase.from('capacity_snapshots').insert([dbSnapshot]).select();
    if (error) throw error;
    await logAudit(actorId, 'INSERT', 'capacity_snapshot', data[0].id, null, dbSnapshot);
    return data[0];
  },

  async aggregateWeeklySnapshots(users: User[], tasks: Task[], actorId: string) {
    const snapshots: any[] = [];
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Sunday is week start
    const currentWeekStart = new Date(new Date().setDate(diff));

    // Calculate for current week + next 11 weeks (total 12 weeks projection)
    for (let i = 0; i < 12; i++) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = new Date(new Date(weekStart).setDate(weekStart.getDate() + 7)).toISOString().split('T')[0];

        for (const user of users) {
          // Task intersects this week: start_date < week_end AND end_date >= week_start
          const intersectingTasks = tasks.filter(t => 
            t.assigneeIds.includes(user.id) && 
            t.status !== 'done' &&
            (t.startDate || t.createdAt) < weekEndStr &&
            (t.dueDate || t.endDate || addDays(new Date(t.startDate || t.createdAt), 1).toISOString()) >= weekStartStr
          );

          const allocatedHours = intersectingTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
          const capacity = user.weeklyCapacityHours || 40;
          let status: 'normal' | 'warn' | 'overload' = 'normal';
          if (allocatedHours > capacity) status = 'overload';
          else if (allocatedHours > capacity * 0.8) status = 'warn';

          snapshots.push({
            user_id: user.id,
            week_start: weekStartStr,
            allocated_hours: allocatedHours,
            status
          });
        }
    }

    // Use upsert to prevent duplicates for the same week/user
    const { data, error } = await supabase
      .from('capacity_snapshots')
      .upsert(snapshots, { onConflict: 'user_id,week_start' })
      .select();

    if (error) throw error;
    await logAudit(actorId, 'UPDATE', 'capacity_snapshots', 'bulk', null, snapshots);
    return data;
  },

  async getDocuments(projectId?: string) {
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: docs, error } = await query;

    if (error) throw error;
    return docs.map((d: any) => ({
      ...d,
      projectId: d.project_id,
      accessLevel: d.access_level,
      status: d.status,
      isPublished: d.is_published,
      publishedAt: d.published_at,
      publishedBy: d.published_by,
      uploadedBy: d.uploaded_by,
      createdAt: d.created_at
    }));
  },

  async getDocumentVersions(documentId: string) {
    const { data: versions, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version', { ascending: false });

    if (error) throw error;
    return versions.map((v: any) => ({
      ...v,
      documentId: v.document_id,
      uploadedBy: v.uploaded_by,
      createdAt: v.created_at
    }));
  },

  async uploadDocument(projectId: string, file: File, metadata: any, actorId: string) {
    const version = 1;
    const path = `nucleovir/${projectId}/documents/v${version}/${file.name}`;
    
    // 1. Upload to Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('nucleovir')
      .upload(path, file);

    if (storageError) throw storageError;

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/nucleovir/${path}`;

    // 2. Insert Document Record
    const dbDoc = {
      project_id: projectId,
      name: file.name,
      file_url: fileUrl,
      version: version,
      tags: metadata.tags || [],
      access_level: metadata.accessLevel || 'all',
      uploaded_by: actorId
    };

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert([dbDoc])
      .select()
      .single();

    if (docError) throw docError;

    // 3. Create Version Entry
    const dbVersion = {
      document_id: doc.id,
      file_url: fileUrl,
      version: version,
      uploaded_by: actorId
    };

    await supabase.from('document_versions').insert([dbVersion]);
    await logAudit(actorId, 'INSERT', 'document', doc.id, null, dbDoc);

    return {
      ...doc,
      projectId: doc.project_id,
      accessLevel: doc.access_level,
      uploadedBy: doc.uploaded_by,
      createdAt: doc.created_at
    };
  },

  async versionDocument(documentId: string, projectId: string, file: File, currentVersion: number, actorId: string) {
    const nextVersion = currentVersion + 1;
    const path = `nucleovir/${projectId}/documents/${nextVersion}/${file.name}`;
    
    // 1. Upload new version to Storage
    // NOTE: Storage MUST succeed and return a valid URL before any DB writes or RPC calls occur.
    // If this fails, the entire operation is aborted to maintain laboratory data integrity.
    const { data: storageData, error: storageError } = await supabase.storage
      .from('nucleovir')
      .upload(path, file);

    if (storageError) throw storageError;

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/nucleovir/${path}`;

    // 2. Call Atomic RPC (Archive + Update)
    const { error: rpcError } = await supabase.rpc('promote_document_version', {
      p_document_id: documentId,
      p_file_url: fileUrl,
      p_version: nextVersion,
      p_uploader_id: actorId
    });

    if (rpcError) throw rpcError;

    await logAudit(actorId, 'UPDATE', 'document', documentId, { version: currentVersion }, { version: nextVersion });

    return { fileUrl, version: nextVersion };
  },

  async submitDocumentForApproval(documentId: string, requesterId: string, approverId: string) {
    const approvalData = {
      task_id: documentId, // Reusing task_id field for flexibility in approval_requests
      requester_id: requesterId,
      approver_id: approverId,
      type: 'document_version',
      status: 'pending'
    };

    const { data: res, error } = await supabase
      .from('approval_requests')
      .insert([approvalData])
      .select()
      .single();

    if (error) throw error;
    
    // Notify Approver
    try {
        const { data: doc } = await supabase.from('documents').select('name, project_id').eq('id', documentId).single();
        const { data: project } = await supabase.from('projects').select('name').eq('id', doc?.project_id).single();
        const { data: requester } = await supabase.from('profiles').select('name').eq('id', requesterId).single();

        if (doc && project && requester) {
            const { notificationService } = await import('./notifications');
            await notificationService.sendNotification('approval_request_received', approverId, {
                entityId: res.id,
                entityType: 'approval_request',
                data: { 
                    title: doc.name, 
                    projectName: project.name, 
                    requesterName: requester.name 
                }
            });
        }
    } catch (nError) {
        console.error('Non-blocking notification error:', nError);
    }

    // Update document status to pending
    await supabase.from('documents').update({ status: 'pending' }).eq('id', documentId);
    
    return res;
  },

  async processDocumentApproval(requestId: string, documentId: string, status: 'approved' | 'rejected', actorId: string) {
    // 1. Fetch current document state for high-precision auditing
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (fetchError) throw fetchError;

    // 2. Update laboratory approval request status
    const { error: requestError } = await supabase
      .from('approval_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (requestError) throw requestError;

    // 3. Promote/Restrict document status based on clinical review
    const documentStatus = status === 'approved' ? 'approved' : 'pending';
    const { error: docError } = await supabase
      .from('documents')
      .update({ status: documentStatus })
      .eq('id', documentId);

    if (docError) throw docError;

    // Notify Document Owner (Uploader)
    try {
        const { data: approver } = await supabase.from('profiles').select('name').eq('id', actorId).single();
        if (approver) {
            const { notificationService } = await import('./notifications');
            await notificationService.sendNotification('approval_resolved', currentDoc.uploaded_by, {
                entityId: documentId,
                entityType: 'document',
                data: {
                    title: currentDoc.name,
                    status,
                    approverName: approver.name
                }
            });
        }
    } catch (nError) {
        console.error('Non-blocking notification error:', nError);
    }

    // 4. Log to immutable laboratory audit trail
    await logAudit(actorId, 'UPDATE', 'document', documentId, 
      { status: currentDoc.status }, 
      { status: documentStatus, reviewer_id: actorId }
    );
  },
  
  async publishDocumentSnapshot(documentId: string, actorId: string) {
    // 1. Fetch document and related project for curated snapshotting
    const { data: doc, error: fetchErr } = await supabase
      .from('documents')
      .select('*, projects(name)')
      .eq('id', documentId)
      .single();
      
    if (fetchErr) throw fetchErr;

    // 2. Curate content JSONB (scrubbed of internal metadata)
    const curatedContent = {
      name: doc.name,
      version: doc.version,
      file_url: doc.file_url,
      projectName: doc.projects.name,
      tags: doc.tags || [],
      published_at: new Date().toISOString()
      // SCRUBBED: uploaded_by, access_level, internal task references, etc.
    };

    // 3. Insert into isolated published_reports table
    const { error: publishErr } = await supabase
      .from('published_reports')
      .insert([{
        project_id: doc.project_id,
        document_id: documentId,
        version: doc.version,
        name: doc.name,
        content: curatedContent,
        file_url: doc.file_url,
        published_by: actorId
      }]);

    if (publishErr) throw publishErr;

    // 4. Update internal laboratory document status
    await supabase.from('documents').update({ is_published: true }).eq('id', documentId);
    
    // 5. Notify Stakeholders with access to this project
    try {
      const { data: stakeholders } = await supabase
        .from('stakeholder_project_access')
        .select('user_id')
        .eq('project_id', doc.project_id);

      if (stakeholders) {
        for (const s of stakeholders) {
          const { notificationService } = await import('./notifications');
          await notificationService.sendNotification('document_published', s.user_id, {
            entityId: documentId,
            entityType: 'document',
            data: {
              docName: doc.name,
              projectName: doc.projects.name
            }
          });
        }
      }
    } catch (nError) {
      console.error('Stakeholder notification error:', nError);
    }

    await logAudit(actorId, 'UPDATE', 'document_publish', documentId, null, { report: curatedContent });
  },

  async addPortalComment(reportId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('stakeholder_feedback')
      .insert([{ report_id: reportId, user_id: userId, content }])
      .select()
      .single();

    if (error) throw error;

    // Notify Project Lead
    try {
        const { data: report } = await supabase.from('published_reports').select('project_id, title').eq('id', reportId).single();
        const { data: project } = await supabase.from('projects').select('lead_id').eq('id', report?.project_id).single();

        if (project?.lead_id && report) {
            const { notificationService } = await import('./notifications');
            await notificationService.sendNotification('stakeholder_feedback_received', project.lead_id, {
                entityId: reportId,
                entityType: 'feedback',
                data: {
                    reportName: report.title,
                    comment: content,
                    projectId: report.project_id
                }
            });
        }
    } catch (nError) {
        console.error('Non-blocking notification error:', nError);
    }

    await logAudit(userId, 'INSERT', 'stakeholder_feedback', reportId, null, { content });
    return data;
  },

  async getPortalComments(reportId: string) {
    const { data, error } = await supabase
      .from('stakeholder_feedback')
      .select('*, profiles(full_name, avatar_url)')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data.map(c => ({
      ...c,
      userName: c.profiles?.full_name,
      userAvatar: c.profiles?.avatar_url
    }));
  },

  async getPublishedReports(projectId?: string) {
    let query = supabase.from('published_reports').select('*').order('published_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(r => ({
      ...r,
      publishedAt: r.published_at,
      fileUrl: r.file_url,
      projectName: r.content.projectName
    }));
  },

  async getStakeholderProjects(userId: string) {
    const { data, error } = await supabase
      .from('stakeholder_project_access')
      .select('projects(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map((d: any) => ({
      ...d.projects,
      dueDate: d.projects.due_date,
      memberIds: d.projects.member_ids || []
    }));
  },

  async updateDocumentAccess(documentId: string, level: 'all' | 'lead' | 'admin', actorId: string) {
    const { error } = await supabase
      .from('documents')
      .update({ access_level: level })
      .eq('id', documentId);

    if (error) throw error;
    await logAudit(actorId, 'UPDATE', 'document_access', documentId, null, { access_level: level });
  },

  // Gantt / Scheduling
  async getMilestones(projectId?: string) {
    let query = supabase.from('milestones').select('*').order('due_date', { ascending: true });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((m: any) => ({
      ...m,
      projectId: m.project_id,
      dueDate: m.due_date,
      createdBy: m.created_by,
      createdAt: m.created_at
    }));
  },

  async addMilestone(milestone: Partial<Milestone>, actorId: string) {
    const dbMilestone = {
      project_id: milestone.projectId,
      name: milestone.name,
      due_date: milestone.dueDate,
      status: milestone.status || 'pending',
      created_by: actorId
    };
    const { data, error } = await supabase.from('milestones').insert([dbMilestone]).select().single();
    if (error) throw error;
    await logAudit(actorId, 'INSERT', 'milestone', data.id, null, dbMilestone);
    return data;
  },

  async getProjectPhases(projectId?: string) {
    let query = supabase.from('project_phases').select('*').order('start_date', { ascending: true });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((p: any) => ({
      ...p,
      projectId: p.project_id,
      startDate: p.start_date,
      endDate: p.end_date,
      createdBy: p.created_by,
      createdAt: p.created_at
    }));
  },

  async addProjectPhase(phase: Partial<ProjectPhase>, actorId: string) {
    const dbPhase = {
      project_id: phase.projectId,
      name: phase.name,
      start_date: phase.startDate,
      end_date: phase.endDate,
      color: phase.color || '#6366f1',
      created_by: actorId
    };
    const { data, error } = await supabase.from('project_phases').insert([dbPhase]).select().single();
    if (error) throw error;
    await logAudit(actorId, 'INSERT', 'project_phase', data.id, null, dbPhase);
    return data;
  },

  async updateProjectPhase(id: string, updates: any, actorId: string) {
    const { data: oldData } = await supabase.from('project_phases').select('*').eq('id', id).single();
    const dbUpdates: any = { ...updates };
    if (updates.startDate) dbUpdates.start_date = updates.startDate;
    if (updates.endDate) dbUpdates.end_date = updates.endDate;
    delete dbUpdates.startDate;
    delete dbUpdates.endDate;

    const { error } = await supabase.from('project_phases').update(dbUpdates).eq('id', id);
    if (error) throw error;
    await logAudit(actorId, 'UPDATE', 'project_phase', id, oldData, dbUpdates);
  },

  async getTaskDependencies(projectId?: string) {
    // If projectId is provided, we filter tasks by projectId first
    let query = supabase.from('task_dependencies').select('*, predecessor:predecessor_task_id(project_id)');
    if (projectId) query = query.eq('predecessor.project_id', projectId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map((d: any) => ({
      ...d,
      predecessorTaskId: d.predecessor_task_id,
      successorTaskId: d.successor_task_id
    }));
  },

  async addTaskDependency(predecessorId: string, successorId: string, actorId: string) {
    // 1. Cycle Detection
    const hasCycle = await this._checkDependencyCycle(predecessorId, successorId);
    if (hasCycle) throw new Error('Clinical Deadlock: Circular dependency detected in research timeline.');

    const dbDep = {
      predecessor_task_id: predecessorId,
      successor_task_id: successorId
    };
    const { data, error } = await supabase.from('task_dependencies').insert([dbDep]).select().single();
    if (error) throw error;
    await logAudit(actorId, 'INSERT', 'task_dependency', data.id, null, dbDep);
    return data;
  },

  async removeTaskDependency(predecessorId: string, successorId: string, actorId: string) {
    const { error } = await supabase
      .from('task_dependencies')
      .delete()
      .eq('predecessor_task_id', predecessorId)
      .eq('successor_task_id', successorId);
    
    if (error) throw error;
    await logAudit(actorId, 'DELETE', 'task_dependency', `${predecessorId}->${successorId}`, null, null);
  },

  async _checkDependencyCycle(preId: string, sucId: string): Promise<boolean> {
    // Basic recursive check for cycles
    // Does sucId (or any of its successors) point back to preId?
    const { data: successors } = await supabase
      .from('task_dependencies')
      .select('successor_task_id')
      .eq('predecessor_task_id', sucId);
    
    if (!successors || successors.length === 0) return false;
    
    for (const dep of successors) {
      if (dep.successor_task_id === preId) return true;
      const nestedCycle = await this._checkDependencyCycle(preId, dep.successor_task_id);
      if (nestedCycle) return true;
    }
    return false;
  },

  async updateTaskDates(taskId: string, startDate: string, endDate: string, actorId: string) {
    const { data: oldTask } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    const updates = { start_date: startDate, end_date: endDate, due_date: endDate };
    
    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (error) throw error;
    
    await logAudit(actorId, 'UPDATE', 'task_dates', taskId, 
      { start_date: oldTask.start_date, end_date: oldTask.end_date }, 
      updates
    );

    // Capacity Recalculation
    if (oldTask.assignee_ids && oldTask.assignee_ids.length > 0) {
      const allTasks = await this.getTasks();
      const allUsers = await this.getProfiles();
      await this.aggregateWeeklySnapshots(allUsers, allTasks, actorId);
    }
  },

  // Notifications
  async getNotificationPreferences(userId: string) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map((d: any) => ({
      ...d,
      userId: d.user_id,
      eventType: d.event_type,
      channels: d.channels || ['email']
    }));
  },

  async updateNotificationPreference(userId: string, eventType: string, enabled: boolean, delivery: 'instant' | 'digest' | 'both' = 'instant', channels: string[] = ['email']) {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        event_type: eventType,
        enabled,
        delivery,
        channels
      }, { onConflict: 'user_id, event_type' });
    
    if (error) throw error;
  },

  async logNotification(recipientId: string, eventType: string, entityType: string | undefined, entityId: string | undefined, subject: string, mode: string, channel: string = 'email') {
    const { error } = await supabase
      .from('notification_log')
      .insert({
        recipient_id: recipientId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        subject: subject,
        delivery_mode: channel // As per Sprint 8 requirements
      });
    
    if (error) throw error;
  },

  async checkDuplicateNotification(recipientId: string, eventType: string, entityId: string, windowHours: number): Promise<boolean> {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('notification_log')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('event_type', eventType)
      .eq('entity_id', entityId)
      .gt('delivered_at', windowStart)
      .limit(1);
    
    if (error) throw error;
    return data.length > 0;
  },

  async getWorkspaceSettings() {
    const { data, error } = await supabase
      .from('workspace_settings')
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateWorkspaceSettings(updates: any, actorId: string) {
    const { data: oldData } = await supabase.from('workspace_settings').select('*').single();
    const { error } = await supabase.from('workspace_settings').update(updates).eq('id', oldData.id);
    if (error) throw error;
    await logAudit(actorId, 'UPDATE', 'workspace_settings', oldData.id, oldData, updates);
  }
};
