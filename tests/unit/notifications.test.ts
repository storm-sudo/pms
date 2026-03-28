import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService } from '@/lib/notifications'
import { supabaseService } from '@/lib/supabase-service'

describe('Notifications Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global fetch for Resend API
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }) as any
  })

  it('should send notification and log it when preferences are enabled', async () => {
    vi.spyOn(supabaseService, 'getProfiles').mockResolvedValue([{ id: 'user-1', email: 'test@nt.gmail.com', name: 'Test User' } as any])
    vi.spyOn(supabaseService, 'getNotificationPreferences').mockResolvedValue([{ eventType: 'approval_request_received', enabled: true } as any])
    vi.spyOn(supabaseService, 'checkDuplicateNotification').mockResolvedValue(false)
    const logSpy = vi.spyOn(supabaseService, 'logNotification').mockResolvedValue({} as any)

    await notificationService.sendNotification('approval_request_received', 'user-1', {
      entityId: 'req-123',
      data: { title: 'Test Request', projectName: 'Project Alpha', requesterName: 'Lead researcher' }
    })

    expect(global.fetch).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('user-1', 'approval_request_received', undefined, 'req-123', expect.any(String), 'instant')
  })

  it('should skip notification if user preference is disabled', async () => {
    vi.spyOn(supabaseService, 'getProfiles').mockResolvedValue([{ id: 'user-1', email: 'test@nt.gmail.com', name: 'Test User' } as any])
    vi.spyOn(supabaseService, 'getNotificationPreferences').mockResolvedValue([{ eventType: 'approval_request_received', enabled: false } as any])

    await notificationService.sendNotification('approval_request_received', 'user-1', {
      entityId: 'req-123',
      data: { title: 'Test Request' }
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should deduplicate notifications within 1-hour window', async () => {
    vi.spyOn(supabaseService, 'getProfiles').mockResolvedValue([{ id: 'user-1', email: 'test@nt.gmail.com', name: 'Test User' } as any])
    vi.spyOn(supabaseService, 'getNotificationPreferences').mockResolvedValue([])
    vi.spyOn(supabaseService, 'checkDuplicateNotification').mockResolvedValue(true)

    await notificationService.sendNotification('approval_request_received', 'user-1', {
      entityId: 'req-123',
      data: { title: 'Test Request' }
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should scrub internal IDs in stakeholder notifications', async () => {
    vi.spyOn(supabaseService, 'getProfiles').mockResolvedValue([{ id: 'stakeholder-1', email: 'external@partner.com', name: 'Partner' } as any])
    vi.spyOn(supabaseService, 'getNotificationPreferences').mockResolvedValue([])
    vi.spyOn(supabaseService, 'checkDuplicateNotification').mockResolvedValue(false)

    await notificationService.sendNotification('document_published', 'stakeholder-1', {
      entityId: 'doc-123',
      data: { 
        docName: 'Clinical Trial Protocol', 
        projectName: 'NucleoVir v1',
        internalId: 'LAB-SECRET-ID-456' // Should be ignored by template
      }
    })

    expect(global.fetch).toHaveBeenCalled()
    const fetchArgs = (global.fetch as any).mock.calls[0][1]
    const body = JSON.parse(fetchArgs.body)
    
    expect(body.html).toContain('Clinical Trial Protocol')
    expect(body.html).not.toContain('LAB-SECRET-ID-456')
    expect(body.html).not.toContain('doc-123')
  })
})
