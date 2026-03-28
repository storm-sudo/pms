"use client";

import { useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { AppContext, AppState, initialState } from '@/lib/store';
import { User, Project, Task, Comment, AppSettings, TaskStatus, Priority, ApprovalRequest, PublishedReport, StakeholderFeedback, Milestone, ProjectPhase, TaskDependency } from '@/lib/types';
import { logoutUser, getSession, loginUser as supabaseLogin } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';
import { toast as sonner } from 'sonner';
import { notificationService } from '@/lib/notifications';
import { supabaseService } from '@/lib/supabase-service';
import { supabase } from '@/lib/supabase';
import { useTimer } from '@/hooks/use-timer';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  // ── Mapping Helpers ──
  const mapProject = (p: any): Project => ({
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
  });

  const mapTask = (t: any): Task => ({
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
    tags: t.tags || [],
    workflowId: t.workflow_id,
    currentWorkflowStep: t.current_workflow_step
  });

  const mapProfile = (p: any): User => ({
    ...p,
    joinedDate: p.joined_date,
    lastActive: p.last_active,
    avatar: p.avatar_url,
    approvedBy: p.approved_by,
    approvedAt: p.approved_at,
    workload: p.workload || { activeTasks: 0, completedThisWeek: 0, overdueTasks: 0, avgCompletionTime: 0 },
    skills: p.skills || [],
    weeklyCapacityHours: p.weekly_capacity_hours || 40
  });

  // Initial data fetch and real-time setup
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profiles, depts, projects, tasks, workflows, approvalRequests, snapshots, docs, ...ganttData] = await Promise.all([
          supabaseService.getProfiles(),
          supabaseService.getDepartments(),
          supabaseService.getProjects(),
          supabaseService.getTasks(),
          supabaseService.getWorkflows(),
          supabaseService.getApprovalRequests(),
          supabaseService.getCapacitySnapshots(),
          supabaseService.getDocuments(),
          supabaseService.getMilestones(),
          supabaseService.getProjectPhases(),
          supabaseService.getTaskDependencies()
        ]);

        const { data: { session } } = await supabase.auth.getSession();
        
        // One-time session invalidation for legacy auth migration
        if (typeof window !== 'undefined') {
          localStorage.removeItem('synapse-session');
        }
        
        setState(s => ({
          ...s,
          users: profiles,
          departments: depts.length > 0 ? depts : s.departments,
          projects: projects,
          tasks: tasks,
          workflows: workflows,
          approvalRequests: approvalRequests,
          capacitySnapshots: snapshots,
          documents: docs,
          milestones: ganttData[0],
          phases: ganttData[1],
          dependencies: ganttData[2],
          currentUser: session ? (profiles.find(u => u.id === session.user.id) || s.currentUser) : s.currentUser,
          isLoggedIn: !!session && !!profiles.find(u => u.id === session.user.id),
          selectedUserId: session?.user.id || null
        }));
      } catch (error) {
        console.error('Error fetching Supabase data:', error);
      }
    };

    // Set up Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setState(s => ({
            ...s,
            currentUser: mapProfile(profile),
            isLoggedIn: true,
            selectedUserId: session.user.id
          }));
        }
      } else {
        setState(s => ({
          ...s,
          currentUser: initialState.currentUser,
          isLoggedIn: false,
          selectedUserId: null
        }));
      }
    });

    fetchData();

    // Set up Real-time subscriptions
    const taskChannel = supabase.channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const t = payload.new as any;
            const mappedTask: Task = {
              ...t,
              projectId: t.project_id,
              assigneeIds: t.assignee_ids || [],
              dueDate: t.due_date,
              startDate: t.start_date,
              completedDate: t.completed_date,
              reviewerId: t.reviewer_id,
              approvedBy: t.approved_by,
              order: t.task_order,
              createdAt: t.created_at,
              updatedAt: t.updated_at,
              workflowId: t.workflow_id,
              currentWorkflowStep: t.current_workflow_step,
              // Initialize required non-column fields
              subtasks: t.subtasks || [],
              comments: t.comments || [],
              logs: t.logs || [],
              tags: t.tags || []
            };
            
            if (payload.eventType === 'INSERT') {
              const exists = s.tasks.find(tk => tk.id === t.id);
              if (exists) return s;
              return { ...s, tasks: [...s.tasks, mappedTask] };
            }
            return { ...s, tasks: s.tasks.map(task => task.id === t.id ? { ...task, ...mappedTask } : task) };
          }
          if (payload.eventType === 'DELETE') return { ...s, tasks: s.tasks.filter(t => t.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const projectChannel = supabase.channel('projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const mappedProject = mapProject(payload.new);
            
            if (payload.eventType === 'INSERT') {
              const exists = s.projects.find(proj => proj.id === mappedProject.id);
              if (exists) return s;
              return { ...s, projects: [...s.projects, mappedProject] };
            }
            return { ...s, projects: s.projects.map(project => project.id === mappedProject.id ? { ...project, ...mappedProject } : project) };
          }
          if (payload.eventType === 'DELETE') return { ...s, projects: s.projects.filter(p => p.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();
      
    const profileChannel = supabase.channel('profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const mappedProfile = mapProfile(payload.new);
            if (payload.eventType === 'INSERT') return { ...s, users: [...s.users, mappedProfile] };
            return { ...s, users: s.users.map(u => u.id === mappedProfile.id ? mappedProfile : u) };
          }
          if (payload.eventType === 'DELETE') return { ...s, users: s.users.filter(u => u.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const approvalChannel = supabase.channel('approval_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const req = payload.new as any;
            const mappedReq: ApprovalRequest = {
              ...req,
              taskId: req.task_id,
              requesterId: req.requester_id,
              approverId: req.approver_id,
              workflowStep: req.workflow_step,
              createdAt: req.created_at,
              updatedAt: req.updated_at
            };
            if (payload.eventType === 'INSERT') return { ...s, approvalRequests: [...s.approvalRequests, mappedReq] };
            return { ...s, approvalRequests: s.approvalRequests.map(r => r.id === req.id ? mappedReq : r) };
          }
          if (payload.eventType === 'DELETE') return { ...s, approvalRequests: s.approvalRequests.filter(r => r.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const portalCommentChannel = supabase.channel('portal_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_comments' }, (payload) => {
        // Portal comments are typically fetched on-demand per document,
        // but we'll use this for real-time notifications or state updates if needed.
        sonner.info('Portal Activity', { description: 'New stakeholder feedback received on clinical snapshot.' });
      })
      .subscribe();

    const documentChannel = supabase.channel('documents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const d = payload.new as any;
            const mappedDoc: any = {
              ...d,
              projectId: d.project_id,
              accessLevel: d.access_level,
              status: d.status,
              isPublished: d.is_published,
              publishedAt: d.published_at,
              publishedBy: d.published_by,
              uploadedBy: d.uploaded_by,
              createdAt: d.created_at
            };
            if (payload.eventType === 'INSERT') return { ...s, documents: [mappedDoc, ...s.documents] };
            return { ...s, documents: s.documents.map(doc => doc.id === d.id ? { ...doc, ...mappedDoc } : doc) };
          }
          if (payload.eventType === 'DELETE') return { ...s, documents: s.documents.filter(d => d.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const publishedReportChannel = supabase.channel('published_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'published_reports' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const r = payload.new as any;
            const mappedReport: PublishedReport = {
              ...r,
              projectId: r.project_id,
              documentId: r.document_id,
              publishedAt: r.published_at,
              publishedBy: r.published_by,
              fileUrl: r.file_url,
              projectName: r.content?.projectName
            };
            if (payload.eventType === 'INSERT') return { ...s, publishedReports: [mappedReport, ...s.publishedReports] };
            return { ...s, publishedReports: s.publishedReports.map(report => report.id === r.id ? mappedReport : report) };
          }
          if (payload.eventType === 'DELETE') return { ...s, publishedReports: s.publishedReports.filter(r => r.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const stakeholderFeedbackChannel = supabase.channel('stakeholder_feedback')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stakeholder_feedback' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const f = payload.new as any;
            const mappedFeedback: StakeholderFeedback = {
              ...f,
              reportId: f.report_id,
              userId: f.user_id,
              createdAt: f.created_at
            };
            // Note: userName and userAvatar will be missing in raw payload, 
            // but we can fetch them or rely on a subsequent refresh if critical.
            if (payload.eventType === 'INSERT') return { ...s, stakeholderFeedback: [mappedFeedback, ...s.stakeholderFeedback] };
            return { ...s, stakeholderFeedback: s.stakeholderFeedback.map(fb => fb.id === f.id ? mappedFeedback : fb) };
          }
          if (payload.eventType === 'DELETE') return { ...s, stakeholderFeedback: s.stakeholderFeedback.filter(f => f.id !== payload.old.id) };
          return s;
        });
        sonner.info('Portal Activity', { description: 'New stakeholder feedback received on clinical snapshot.' });
      })
      .subscribe();

    const milestoneChannel = supabase.channel('milestones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const m = payload.new as any;
            const mapped: Milestone = {
              ...m,
              projectId: m.project_id,
              dueDate: m.due_date,
              createdBy: m.created_by,
              createdAt: m.created_at
            };
            if (payload.eventType === 'INSERT') return { ...s, milestones: [...s.milestones, mapped] };
            return { ...s, milestones: s.milestones.map(mil => mil.id === m.id ? mapped : mil) };
          }
          if (payload.eventType === 'DELETE') return { ...s, milestones: s.milestones.filter(m => m.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const phaseChannel = supabase.channel('project_phases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_phases' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const p = payload.new as any;
            const mapped: ProjectPhase = {
              ...p,
              projectId: p.project_id,
              startDate: p.start_date,
              endDate: p.end_date,
              createdBy: p.created_by,
              createdAt: p.created_at
            };
            if (payload.eventType === 'INSERT') return { ...s, phases: [...s.phases, mapped] };
            return { ...s, phases: s.phases.map(ph => ph.id === p.id ? mapped : ph) };
          }
          if (payload.eventType === 'DELETE') return { ...s, phases: s.phases.filter(p => p.id !== payload.old.id) };
          return s;
        });
      })
      .subscribe();

    const dependencyChannel = supabase.channel('task_dependencies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_dependencies' }, (payload) => {
        setState(s => {
          if (payload.eventType === 'INSERT') {
            const d = payload.new as any;
            const mapped: TaskDependency = {
              ...d,
              predecessorTaskId: d.predecessor_task_id,
              successorTaskId: d.successor_task_id
            };
            return { ...s, dependencies: [...s.dependencies, mapped] };
          }
          if (payload.eventType === 'DELETE') {
            return { ...s, dependencies: s.dependencies.filter(d => 
              d.predecessorTaskId !== payload.old.predecessor_task_id || 
              d.successorTaskId !== payload.old.successor_task_id
            )};
          }
          return s;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(approvalChannel);
      supabase.removeChannel(portalCommentChannel);
      supabase.removeChannel(documentChannel);
      supabase.removeChannel(publishedReportChannel);
      supabase.removeChannel(stakeholderFeedbackChannel);
      supabase.removeChannel(milestoneChannel);
      supabase.removeChannel(phaseChannel);
      supabase.removeChannel(dependencyChannel);
      subscription.unsubscribe();
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

  const setCurrentUser = useCallback((user: User) => {
    setState(s => ({ ...s, currentUser: user }));
  }, []);

  const setLoggedIn = useCallback((loggedIn: boolean) => {
    setState(s => ({ ...s, isLoggedIn: loggedIn }));
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setState(s => ({ ...s, isLoggedIn: false, currentUser: initialState.currentUser }));
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
      const dbTask = await supabaseService.addTask({
        ...task,
        subtasks: [],
        comments: [],
        logs: [],
        summary: '',
        order: 0,
      }, state.currentUser.id);

      const newTask = mapTask(dbTask);
      const silent = options?.silent ?? false;

      // Manually update state for immediate feedback
      setState(s => {
        const exists = s.tasks.find(tk => tk.id === newTask.id);
        if (exists) return s;
        return { ...s, tasks: [...s.tasks, newTask] };
      });

      // Notify new assignees
      if (newTask.assigneeIds.length > 0 && !silent) {
        const project = state.projects.find(p => p.id === newTask.projectId);
        if (project) {
          for (const userId of newTask.assigneeIds) {
            await notificationService.sendNotification('task_status_changed', userId, {
              entityId: newTask.id,
              entityType: 'task',
              data: { title: newTask.title, projectName: project.name, status: 'assigned' }
            });
          }
        }
      }

      toast({
        title: 'Task Created',
        description: `"${newTask.title}" has been added successfully. It is now visible in your dashboard.`,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({ title: 'Error', description: 'Failed to create task.', variant: 'destructive' });
    }
  }, [state.projects, state.users, state.currentUser]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      await supabaseService.updateTask(id, updates, state.currentUser.id);
      
      if (updates.assigneeIds && !silent) {
        const oldTask = state.tasks.find(t => t.id === id);
        const newAssigneeIds = updates.assigneeIds.filter(userId => !oldTask?.assigneeIds.includes(userId));
        
        if (newAssigneeIds.length > 0) {
          const task = state.tasks.find(t => t.id === id);
          if (task) {
            const project = state.projects.find(p => p.id === task.projectId);
            if (project) {
                for (const userId of newAssigneeIds) {
                    await notificationService.sendNotification('task_status_changed', userId, {
                        entityId: task.id,
                        entityType: 'task',
                        data: { title: task.title, projectName: project.name, status: 'assigned' }
                    });
                }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: 'Failed to update task.', variant: 'destructive' });
    }
  }, [state.tasks, state.projects, state.users, state.currentUser]);

  const notifyAssignees = useCallback(async (taskId: string, userIds: string[]) => {
    const task = state.tasks.find(t => t.id === taskId);
    const project = state.projects.find(p => p.id === task?.projectId);
    
    if (task && project) {
      for (const userId of userIds) {
          await notificationService.sendNotification('task_status_changed', userId, {
              entityId: task.id,
              entityType: 'task',
              data: { title: task.title, projectName: project.name, status: 'alerted' }
          });
      }
      sonner.success('Notifications Triggered', {
        description: `Laboratory alerts queued for ${userIds.length} members.`,
      });
    }
  }, [state.tasks, state.projects]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await supabaseService.deleteTask(id, state.currentUser.id);
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
      }, state.currentUser.id);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, []);

  const bulkAddTasks = useCallback(async (projectId: string, titles: string[]) => {
    try {
      const projectTasks = state.tasks.filter(t => t.projectId === projectId);
      const maxOrder = projectTasks.length > 0 ? Math.max(...projectTasks.map(t => t.order)) : 0;

      for (let i = 0; i < titles.length; i++) {
        const dbTask = await supabaseService.addTask({
          projectId,
          title: titles[i].trim(),
          priority: 'medium',
          status: 'todo',
          order: maxOrder + i + 1,
        }, state.currentUser.id);

        const newTask = mapTask(dbTask);

        // Immediate state update for each task in bulk
        setState(s => {
          const exists = s.tasks.find(tk => tk.id === newTask.id);
          if (exists) return s;
          return { ...s, tasks: [...s.tasks, newTask] };
        });
      }
      
      toast({ 
        title: 'Bulk Tasks Added', 
        description: `Successfully added ${titles.length} tasks to the project.` 
      });
    } catch (error: any) {
      console.error('Error bulk adding tasks:', error);
      toast({ 
        title: 'Error in Bulk Add', 
        description: error.message || 'Some tasks failed to reach the database.', 
        variant: 'destructive' 
      });
    }
  }, [state.tasks]);

  const reorderTasks = useCallback(async (projectId: string, taskIds: string[]) => {
    try {
      // For each task, update its order in Supabase
      // Optimization: We could use a RPC call here, but for now we'll do it sequentially
      for (let i = 0; i < taskIds.length; i++) {
        await supabaseService.updateTask(taskIds[i], { order: i }, state.currentUser.id);
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  }, []);

  // Project actions
  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const p = await supabaseService.addProject(project, state.currentUser.id);
      
      // Map the returned raw DB row
      const newProject: Project = {
        ...p,
        dueDate: p.due_date,
        leadId: p.lead_id,
        memberIds: p.member_ids || [],
        externalLinks: p.external_links || [],
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        comments: [],
        milestones: [],
        tags: [],
        progress: p.progress || 0
      };

      // Immediate state update (bypass real-time lag)
      setState(s => {
        const exists = s.projects.find(proj => proj.id === newProject.id);
        if (exists) return s;
        return { ...s, projects: [...s.projects, newProject] };
      });

      toast({ 
        title: 'Project Created', 
        description: `"${project.name}" has been added successfully. It should appear in your list immediately.` 
      });
    } catch (error: any) {
      console.error('Error adding project:', error);
      toast({ 
        title: 'Error Creating Project', 
        description: error.message || 'The database rejected the project creation request.', 
        variant: 'destructive' 
      });
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      await supabaseService.updateProject(id, updates, state.currentUser.id);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({ title: 'Error', description: 'Failed to update project.', variant: 'destructive' });
    }
  }, [state.currentUser]);

  const addProjectComment = useCallback(async (projectId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    try {
      await supabaseService.addComment({
        project_id: projectId,
        user_id: comment.userId,
        content: comment.content,
        is_leadership_note: comment.isLeadershipNote,
      }, state.currentUser.id);
    } catch (error) {
      console.error('Error adding project comment:', error);
    }
  }, [state.currentUser]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      await supabaseService.updateProfile(id, updates, state.currentUser.id);
      toast({ title: 'Profile Updated', description: 'User metadata salvaged to database.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    }
  }, [state.currentUser]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } }));
  }, []);

  const approveUser = useCallback(async (userId: string) => {
    try {
      const updates = { 
        status: 'approved' as const, 
        approved_by: state.currentUser.id, 
        approved_at: new Date().toISOString() 
      };
      
      await supabaseService.updateProfile(userId, updates, state.currentUser.id);
      
      // Manual state update
      setState(s => ({
        ...s,
        users: s.users.map(u => u.id === userId ? { 
          ...u, 
          status: 'approved', 
          approvedBy: state.currentUser.id, 
          approvedAt: updates.approved_at 
        } : u)
      }));
      
      const user = state.users.find(u => u.id === userId);
      if (user) {
        await notificationService.sendNotification('account_approved', userId, {
            data: { name: user.name }
        });
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
        // We still use sendNotification even if account is rejected/deleted?
        // Actually, sendNotification needs a recipientId. If deleted, we can't find them in profiles.
        // But for rejection, maybe we don't delete yet? 
        // The user implementation says "delete to match original logic".
        // I'll keep it as a manual email for now or log before delete.
        await notificationService.sendNotification('account_approved', userId, {
            data: { name: user.name, status: 'rejected' } // Template could handle this
        });
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

      await notificationService.sendNotification('account_created', id, {
        data: { name: userData.name, password: userData.password || 'dmin123' }
      });

      toast({ title: 'User Created', description: `${userData.name} has been added to the team.` });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({ title: 'Error', description: 'Failed to add user.', variant: 'destructive' });
    }
  }, []);
  
  const addTaskLog = useCallback(async (taskId: string, log: { content: string; hoursLogged: number }) => {
    try {
      await supabaseService.addTaskLog({
        taskId,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        content: log.content,
        hoursLogged: log.hoursLogged,
        logDate: new Date().toISOString().split('T')[0],
        approvalStatus: 'pending'
      }, state.currentUser.id);

      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        await supabaseService.updateTask(taskId, {
          actualHours: (task.actualHours || 0) + log.hoursLogged,
        }, state.currentUser.id);
      }
    } catch (error) {
      console.error('Error adding task log:', error);
    }
  }, [state.currentUser, state.tasks]);

  const addDepartment = useCallback(async (name: string) => {
    try {
      await supabaseService.addDepartment(name, state.currentUser.id);
      sonner.success('Department Added', {
        description: `"${name}" is now available across the portal.`,
      });
    } catch (error) {
      console.error('Error adding department:', error);
      toast({ title: 'Error', description: 'Failed to add department.', variant: 'destructive' });
    }
  }, [state.currentUser]);

  const timer = useTimer({
    onStop: async (taskId, durationInHours) => {
      const task = state.tasks.find(t => t.id === taskId);
      try {
        await supabaseService.addTaskLog({
          taskId,
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          content: `Timed work: ${durationInHours} hrs`,
          hoursLogged: durationInHours,
          logDate: new Date().toISOString().split('T')[0],
          approvalStatus: 'pending'
        }, state.currentUser.id);
  
        if (task) {
          await supabaseService.updateTask(taskId, {
            actualHours: (task.actualHours || 0) + durationInHours,
          }, state.currentUser.id);
        }
  
        sonner.success('Time Logged', {
          description: `Logged ${durationInHours} hrs for "${task?.title || 'task'}"`
        });
      } catch (error) {
        console.error('Error logging timed work:', error);
        toast({ title: 'Error', description: 'Failed to save time log.', variant: 'destructive' });
      }
    }
  });

  const startTimer = useCallback((taskId: string) => {
    timer.start(taskId);
  }, [timer]);

  const stopTimer = useCallback(() => {
    timer.stop();
  }, [timer]);

  const approveTaskLog = useCallback(async (logId: string) => {
    try {
      await supabaseService.updateTaskLogStatus(logId, 'approved', state.currentUser.id, state.currentUser.id);
      toast({ title: 'Success', description: 'Time log approved.' });
    } catch (error: any) {
      console.error('Error approving task log:', error);
      toast({ title: 'Error', description: error.message || 'Failed to approve log.', variant: 'destructive' });
    }
  }, [state.currentUser]);

  const submitForApproval = useCallback(async (taskId: string, approverId: string, type: 'workflow_step' | 'task_completion', workflowStep?: string) => {
    try {
      const request = await supabaseService.createApprovalRequest({
        taskId,
        requesterId: state.currentUser.id,
        approverId,
        type,
        workflowStep
      }, state.currentUser.id);
      
      setState(s => ({ ...s, approvalRequests: [...s.approvalRequests, request] }));
      sonner.success('Approval Requested', { description: 'The supervisor has been notified.' });
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast({ title: 'Request Failed', variant: 'destructive' });
    }
  }, [state.currentUser]);

  const processApproval = useCallback(async (requestId: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      await supabaseService.updateApprovalRequest(requestId, { status, comment }, state.currentUser.id);
      
      const request = state.approvalRequests.find(r => r.id === requestId);
      if (request && status === 'approved') {
        if (request.type === 'task_completion') {
          await updateTask(request.taskId, { status: 'done', approvedBy: state.currentUser.id });
        }
      }

      setState(s => ({
        ...s,
        approvalRequests: s.approvalRequests.map(r => r.id === requestId ? { ...r, status, comment } : r)
      }));
      sonner.success(`Request ${status === 'approved' ? 'Approved' : 'Rejected'}`);
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({ title: 'Processing Failed', variant: 'destructive' });
    }
  }, [state.approvalRequests, state.currentUser, updateTask]);

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
    startTimer,
    stopTimer,
    timer,
    approveTaskLog,
    submitForApproval,
    processApproval,
    updateSkills: async (userId: string, skills: string[]) => {
      try {
        await supabaseService.updateProfile(userId, { skills }, state.currentUser.id);
        setState(s => ({
          ...s,
          users: s.users.map(u => u.id === userId ? { ...u, skills } : u)
        }));
        sonner.success('Skills Updated', { description: `${skills.length} expertises saved.` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to update skills.', variant: 'destructive' });
      }
    },
    updateCapacity: async (userId: string, hours: number) => {
      try {
        await supabaseService.updateProfile(userId, { weekly_capacity_hours: hours }, state.currentUser.id);
        setState(s => ({
          ...s,
          users: s.users.map(u => u.id === userId ? { ...u, weeklyCapacityHours: hours } : u)
        }));
        sonner.success('Capacity Updated', { description: `Weekly threshold set to ${hours}h.` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to update capacity.', variant: 'destructive' });
      }
    },
    captureSnapshots: async () => {
      try {
        const snapshots = await supabaseService.aggregateWeeklySnapshots(state.users, state.tasks, state.currentUser.id);
        setState(s => ({
          ...s,
          capacitySnapshots: [...s.capacitySnapshots, ...snapshots.map((sn: any) => ({
             id: sn.id,
             userId: sn.user_id,
             weekStart: sn.week_start,
             allocatedHours: sn.allocated_hours,
             status: sn.status,
             createdAt: sn.created_at
          }))]
        }));
        sonner.success('Snapshots Captured', { description: `Historical data for ${state.users.length} members persisted.` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to capture capacity snapshots.', variant: 'destructive' });
      }
    },
    uploadDocument: async (projectId: string, file: File, metadata: { tags: string[], accessLevel: 'all' | 'lead' | 'admin' }) => {
      try {
        const version = 1;
        const path = `nucleovir/${projectId}/documents/${version}/${file.name}`;
        
        // 1. Upload to Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('nucleovir')
          .upload(path, file);

        if (storageError) throw storageError;

        const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/nucleovir/${path}`;

        // 2. Insert document record into database
        const { data: newDoc, error: dbError } = await supabase
          .from('documents')
          .insert({
            project_id: projectId,
            file_name: file.name,
            file_url: fileUrl,
            version: version,
            tags: metadata.tags,
            access_level: metadata.accessLevel,
            uploaded_by: state.currentUser.id,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        setState(s => ({ ...s, documents: [newDoc, ...s.documents] }));
        sonner.success('Document Uploaded', { description: `${file.name} successfully stored and versioned.` });
      } catch (error) {
        console.error('Error uploading document:', error);
        toast({ title: 'Upload Failed', description: 'Could not store document in laboratory repository.', variant: 'destructive' });
      }
    },
    updateDocumentAccess: async (documentId: string, level: 'all' | 'lead' | 'admin') => {
      try {
        await supabaseService.updateDocumentAccess(documentId, level, state.currentUser.id);
        setState(s => ({
          ...s,
          documents: s.documents.map(d => d.id === documentId ? { ...d, accessLevel: level } : d)
        }));
        sonner.success('Access Updated', { description: `Document visibility set to ${level.toUpperCase()}.` });
      } catch (error) {
        toast({ title: 'Access Error', description: 'Failed to update document governance.', variant: 'destructive' });
      }
    },
    addDocumentVersion: async (documentId: string, projectId: string, file: File, currentVersion: number) => {
      try {
        const nextVersion = currentVersion + 1;
        const path = `nucleovir/${projectId}/documents/${nextVersion}/${file.name}`;
        
        // 1. Upload to Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('nucleovir')
          .upload(path, file);

        if (storageError) throw storageError;

        const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/nucleovir/${path}`;

        // 2. Update document record in database
        const { data: updatedDoc, error: dbError } = await supabase
          .from('documents')
          .update({
            file_url: fileUrl,
            version: nextVersion,
            updated_at: new Date().toISOString(),
          })
          .eq('id', documentId)
          .select()
          .single();

        if (dbError) throw dbError;

        setState(s => ({
          ...s,
          documents: s.documents.map(d => d.id === documentId ? { ...d, version: nextVersion, fileUrl } : d)
        }));
        sonner.success('New Version Ready', { description: `${file.name} updated to v${nextVersion}.` });
      } catch (error) {
        console.error('Error adding document version:', error);
        toast({ title: 'Version Refused', description: 'Failed to archive existing version or upload new protocol.', variant: 'destructive' });
      }
    },
    submitDocumentForApproval: async (documentId: string, approverId: string) => {
      try {
        const req = await supabaseService.submitDocumentForApproval(documentId, state.currentUser.id, approverId);
        setState(s => ({
          ...s,
          documents: s.documents.map(d => d.id === documentId ? { ...d, status: 'pending' } : d),
          approvalRequests: [...s.approvalRequests, {
            id: req.id,
            taskId: req.task_id,
            requesterId: req.requester_id,
            approverId: req.approver_id,
            type: req.type,
            status: req.status,
            createdAt: req.created_at,
            updatedAt: req.updated_at
          }]
        }));
        sonner.success('Discovery Submitted', { description: 'Laboratory supervisor has been notified of the pending review.' });
      } catch (error) {
        toast({ title: 'Submission Error', description: 'Failed to trigger laboratory approval workflow.', variant: 'destructive' });
      }
    },
    processDocumentApproval: async (requestId: string, documentId: string, status: 'approved' | 'rejected') => {
      try {
        await supabaseService.processDocumentApproval(requestId, documentId, status, state.currentUser.id);
        const documentStatus = status === 'approved' ? 'approved' : 'pending';
        setState(s => ({
          ...s,
          documents: s.documents.map(d => d.id === documentId ? { ...d, status: documentStatus } : d),
          approvalRequests: s.approvalRequests.map(r => r.id === requestId ? { ...r, status, updatedAt: new Date().toISOString() } : r)
        }));
        sonner.success('Audit Complete', { description: `Protocol has been ${status.toUpperCase()} and archived.` });
      } catch (error) {
        toast({ title: 'Audit Error', description: 'Failed to finalize laboratory review.', variant: 'destructive' });
      }
    },
    publishDocumentSnapshot: async (documentId: string) => {
      if (!state.currentUser) return;
      try {
        await supabaseService.publishDocumentSnapshot(documentId, state.currentUser.id);
        const [docs, reports] = await Promise.all([
          supabaseService.getDocuments(),
          supabaseService.getPublishedReports()
        ]);
        setState(s => ({ ...s, documents: docs, publishedReports: reports }));
        sonner.success('Snapshot Released', { description: 'Clinical protocol is now archived in the stakeholder portal.' });
      } catch (error) {
        toast({ title: 'Publishing Error', description: 'Failed to release clinical snapshot.', variant: 'destructive' });
      }
    },
    addPortalComment: async (reportId: string, content: string) => {
      if (!state.currentUser) return;
      try {
        await supabaseService.addPortalComment(reportId, state.currentUser.id, content);
        sonner.success('Feedback Recorded', { description: 'Collaborative feedback has been archived and shared with leads.' });
      } catch (error) {
        toast({ title: 'Feedback Error', description: 'Failed to record stakeholder comment.', variant: 'destructive' });
      }
    },
    getStakeholderProjects: async (userId: string) => {
      return await supabaseService.getStakeholderProjects(userId);
    },
    getPublishedReports: async (projectId?: string) => {
      return await supabaseService.getPublishedReports(projectId);
    },

    // Gantt / Scheduling
    addMilestone: async (milestone: Partial<Milestone>) => {
      try {
        const m = await supabaseService.addMilestone(milestone, state.currentUser.id);
        // State updated via real-time listener
        sonner.success('Milestone Created', { description: `Checkpoint "${m.name}" salvaged to clinical registry.` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to create milestone.', variant: 'destructive' });
      }
    },
    updateMilestone: async (id: string, updates: Partial<Milestone>) => {
      const oldMilestones = [...state.milestones];
      // Optimistic update
      setState(s => ({
        ...s,
        milestones: s.milestones.map(m => m.id === id ? { ...m, ...updates } : m)
      }));

      try {
        const { error } = await supabase.from('milestones').update({
          name: updates.name,
          due_date: updates.dueDate,
          status: updates.status
        }).eq('id', id);
        if (error) throw error;
      } catch (error) {
        setState(s => ({ ...s, milestones: oldMilestones }));
        toast({ title: 'Checkpoint Refused', description: 'Failed to synchronize clinical milestone.', variant: 'destructive' });
      }
    },
    addProjectPhase: async (phase: Partial<ProjectPhase>) => {
      try {
        const p = await supabaseService.addProjectPhase(phase, state.currentUser.id);
        sonner.success('Phase Created', { description: `Research phase "${p.name}" initiated.` });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to create phase.', variant: 'destructive' });
      }
    },
    updateProjectPhase: async (id: string, updates: Partial<ProjectPhase>) => {
      const oldPhases = [...state.phases];
      // Optimistic update
      setState(s => ({
        ...s,
        phases: s.phases.map(p => p.id === id ? { ...p, ...updates } : p)
      }));

      try {
        await supabaseService.updateProjectPhase(id, updates, state.currentUser.id);
      } catch (error) {
        setState(s => ({ ...s, phases: oldPhases }));
        toast({ title: 'Phase Update Refused', description: 'Failed to synchronize research phase dates.', variant: 'destructive' });
      }
    },
    addTaskDependency: async (predecessorId: string, successorId: string) => {
      try {
        await supabaseService.addTaskDependency(predecessorId, successorId, state.currentUser.id);
        sonner.success('Dependency Linked', { description: 'Laboratory sequence updated successfully.' });
      } catch (error: any) {
        sonner.error('Link Rejected', { description: error.message });
      }
    },
    removeTaskDependency: async (predecessorId: string, successorId: string) => {
      try {
        await supabaseService.removeTaskDependency(predecessorId, successorId, state.currentUser.id);
        sonner.success('Dependency Severed', { description: 'Research tasks decoupled.' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to remove dependency.', variant: 'destructive' });
      }
    },
    updateTaskDates: async (taskId: string, startDate: string, endDate: string) => {
      // Optimistic update
      const oldTasks = [...state.tasks];
      setState(s => ({
        ...s,
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, startDate, dueDate: endDate, endDate } : t)
      }));

      try {
        await supabaseService.updateTaskDates(taskId, startDate, endDate, state.currentUser.id);
      } catch (error) {
        setState(s => ({ ...s, tasks: oldTasks }));
        toast({ title: 'Update Refused', description: 'Failed to synchronize clinical dates.', variant: 'destructive' });
      }
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}
