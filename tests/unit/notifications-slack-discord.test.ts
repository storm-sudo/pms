import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies at the top level
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('../../lib/supabase-service', () => ({
  supabaseService: {
    getProfiles: vi.fn(),
    getNotificationPreferences: vi.fn(),
    checkDuplicateNotification: vi.fn(),
    logNotification: vi.fn(),
    getWorkspaceSettings: vi.fn()
  }
}))

describe('Slack & Discord Notifications Flow', () => {
  let callCount = 0;
  let lastBody: any = null;

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    callCount = 0;
    lastBody = null;
    
    // Manual mock fetch to bypass vitest tracking issues in jsdom
    const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        callCount++;
        if (options?.body) {
            lastBody = JSON.parse(options.body);
        }
        if (url.toString().includes('dispatch-webhook')) {
            return { ok: true, json: async () => ({ success: true }) };
        }
        return { ok: true, json: async () => ({ id: 'resend-123' }) };
    });
    
    vi.stubGlobal('fetch', mockFetch);
  })

  it('should dispatch to Slack when channels include slack', async () => {
    const { notificationService } = await import('../../lib/notifications');
    const { supabaseService } = await import('../../lib/supabase-service');

    vi.mocked(supabaseService.getProfiles).mockResolvedValue([{ id: 'user-1', email: 'test@nt.gmail.com', name: 'Test User' } as any])
    vi.mocked(supabaseService.getWorkspaceSettings).mockResolvedValue({ slack_enabled: true, discord_enabled: true } as any)
    vi.mocked(supabaseService.getNotificationPreferences).mockResolvedValue([{ 
      eventType: 'approval_request_received', 
      enabled: true,
      channels: ['email', 'slack']
    } as any])
    vi.mocked(supabaseService.checkDuplicateNotification).mockResolvedValue(false)
    vi.mocked(supabaseService.logNotification).mockResolvedValue({} as any)

    await notificationService.sendNotification('approval_request_received', 'user-1', {
      entityId: 'req-123',
      data: { title: 'Test Request', projectName: 'Project Alpha', requesterName: 'Lead researcher' }
    })

    // Verify via manual counter since vi.fn() tracking is flaky in this env
    expect(callCount).toBe(2)
    expect(lastBody.platform).toBe('slack');
    expect(lastBody.event_type).toBe('approval_request_received');
  })

  it('should dispatch to Discord when channels include discord', async () => {
    const { notificationService } = await import('../../lib/notifications');
    const { supabaseService } = await import('../../lib/supabase-service');

    vi.mocked(supabaseService.getProfiles).mockResolvedValue([{ id: 'user-1', email: 'test@nt.gmail.com', name: 'Test User' } as any])
    vi.mocked(supabaseService.getWorkspaceSettings).mockResolvedValue({ slack_enabled: true, discord_enabled: true } as any)
    vi.mocked(supabaseService.getNotificationPreferences).mockResolvedValue([{ 
      eventType: 'researcher_overload', 
      enabled: true,
      channels: ['discord']
    } as any])
    vi.mocked(supabaseService.checkDuplicateNotification).mockResolvedValue(false)
    vi.mocked(supabaseService.logNotification).mockResolvedValue({} as any)

    await notificationService.sendNotification('researcher_overload', 'user-1', {
      data: { researcherName: 'Dr. Smith', load: 120, threshold: 100 }
    })

    expect(callCount).toBe(1)
    expect(lastBody.platform).toBe('discord');
    expect(lastBody.event_type).toBe('researcher_overload');
  })

  it('should skip Slack/Discord if not in user channels', async () => {
    const { notificationService } = await import('../../lib/notifications');
    const { supabaseService } = await import('../../lib/supabase-service');

    vi.mocked(supabaseService.getProfiles).mockResolvedValue([{ id: 'user-1', email: 'test@nt.gmail.com', name: 'Test User' } as any])
    vi.mocked(supabaseService.getWorkspaceSettings).mockResolvedValue({ slack_enabled: true, discord_enabled: true } as any)
    vi.mocked(supabaseService.getNotificationPreferences).mockResolvedValue([{ 
      eventType: 'task_status_changed', 
      enabled: true,
      channels: ['email']
    } as any])
    vi.mocked(supabaseService.checkDuplicateNotification).mockResolvedValue(false)
    vi.mocked(supabaseService.logNotification).mockResolvedValue({} as any)

    await notificationService.sendNotification('task_status_changed', 'user-1', {
      entityId: 'task-1',
      data: { title: 'Update Protocol', status: 'done' }
    })

    expect(callCount).toBe(1)
    expect(lastBody.to).toBe('test@nt.gmail.com');
  })
})
