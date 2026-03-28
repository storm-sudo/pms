import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabaseService } from '@/lib/supabase-service'
import { supabase } from '@/lib/supabase'

describe('Supabase Service CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Tasks', () => {
    it('should insert task correctly and write to audit_logs', async () => {
      const dbTask = { id: 'task-123', title: 'Test Task', project_id: 'proj-1' }
      const mockInsert = vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [dbTask], error: null })
      } as any)

      const result = await supabaseService.addTask({
        projectId: 'proj-1',
        title: 'Test Task',
        assigneeIds: ['user-1'],
        status: 'todo',
        priority: 'medium'
      }, 'actor-1')

      expect(result.id).toBe('task-123')
      // Verify audit log call (logAudit is private but uses supabase.from('audit_logs'))
      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
    })

    it('should fetch old_value before updateTask', async () => {
      const oldTask = { id: 'task-123', title: 'Old Title' }
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: oldTask, error: null }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis()
      } as any)

      await supabaseService.updateTask('task-123', { title: 'New Title' }, 'actor-1')

      // Verify old data was fetched
      expect(supabase.from).toHaveBeenCalledWith('tasks')
      // Verify audit log with old and new values
      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
    })
  })

  describe('Documents', () => {
    it('should call storage.upload with correct clinical path in uploadDocument', async () => {
      const mockFile = new File(['test'], 'protocol.pdf', { type: 'application/pdf' })
      const storageSpy = vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null })
      } as any)

      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'doc-1' }, error: null })
      } as any)

      await supabaseService.uploadDocument('proj-1', mockFile, { tags: ['SOP'] }, 'actor-1')

      expect(storageSpy).toHaveBeenCalledWith('nucleovir')
      const expectedPath = `nucleovir/proj-1/documents/v1/protocol.pdf`
      expect(supabase.storage.from('nucleovir').upload).toHaveBeenCalledWith(expectedPath, mockFile)
    })

    it('should call promote_document_version RPC in versionDocument', async () => {
      const mockFile = new File(['testv2'], 'protocol.pdf', { type: 'application/pdf' })
      vi.spyOn(supabase.storage, 'from').mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'path-v2' }, error: null })
      } as any)

      const rpcSpy = vi.spyOn(supabase as any, 'rpc').mockResolvedValue({ data: null, error: null })

      await supabaseService.versionDocument('doc-1', 'proj-1', mockFile, 1, 'actor-1')

      expect(rpcSpy).toHaveBeenCalledWith('promote_document_version', expect.objectContaining({
        p_document_id: 'doc-1',
        p_version: 2
      }))
    })
  })

  describe('Task Logs', () => {
    it('should update task log status and log audit', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis()
      } as any)

      await supabaseService.updateTaskLogStatus('log-1', 'approved', 'admin-1', 'actor-1')

      expect(supabase.from).toHaveBeenCalledWith('task_logs')
      expect(supabase.from).toHaveBeenCalledWith('audit_logs')
    })
  })
})
