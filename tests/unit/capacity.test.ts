import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { supabaseService } from '@/lib/supabase-service'
import { supabase } from '@/lib/supabase'
import { addDays } from 'date-fns'

describe('Clinical Capacity Aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Set "today" to a fixed Sunday for deterministic weekStart (2026-03-29 is a Sunday)
    vi.setSystemTime(new Date('2026-03-29T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should calculate current week snapshot correctly for single assigned task', async () => {
    const mockUsers = [{ id: 'user-1', name: 'Researcher', weeklyCapacityHours: 40 } as any]
    const mockTasks = [{ 
      id: 'task-1', 
      assigneeIds: ['user-1'], 
      estimatedHours: 10,
      status: 'todo',
      startDate: '2026-03-29',
      dueDate: '2026-04-01'
    } as any]

    const upsertSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    await supabaseService.aggregateWeeklySnapshots(mockUsers, mockTasks, 'actor-1')

    // First week snapshot (2026-03-29)
    expect(upsertSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        user_id: 'user-1',
        week_start: '2026-03-29',
        allocated_hours: 10,
        status: 'normal'
      })
    ]), expect.any(Object))
  })

  it('should detect overload when total hours exceed capacity', async () => {
    const mockUsers = [{ id: 'user-1', weeklyCapacityHours: 40 } as any]
    const mockTasks = [
      { id: 't1', assigneeIds: ['user-1'], estimatedHours: 25, status: 'todo', startDate: '2026-03-29' },
      { id: 't2', assigneeIds: ['user-1'], estimatedHours: 16, status: 'todo', startDate: '2026-03-29' }
    ] as any

    const upsertSpy = vi.spyOn(supabase, 'from').mockReturnValue({
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    await supabaseService.aggregateWeeklySnapshots(mockUsers, mockTasks, 'actor-1')

    expect(upsertSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        user_id: 'user-1',
        allocated_hours: 41,
        status: 'overload'
      })
    ]), expect.any(Object))
  })

  it('should calculate snapshots for tasks spanning multiple weeks', async () => {
    const mockUsers = [{ id: 'user-1', weeklyCapacityHours: 40 } as any]
    // Task spans 2 weeks (Starts Mar 29, Ends Apr 10)
    const mockTasks = [{ 
      id: 'task-long', 
      assigneeIds: ['user-1'], 
      estimatedHours: 20,
      status: 'todo',
      startDate: '2026-03-29',
      dueDate: '2026-04-10'
    } as any]

    const upsertMock = vi.fn().mockReturnThis()
    vi.spyOn(supabase, 'from').mockReturnValue({
      upsert: upsertMock,
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    } as any)

    await supabaseService.aggregateWeeklySnapshots(mockUsers, mockTasks, 'actor-1')

    // Snapshot for Week 1 (Mar 29)
    expect(upsertMock).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ week_start: '2026-03-29', allocated_hours: 20 }),
      expect.objectContaining({ week_start: '2026-04-05', allocated_hours: 20 })
    ]), expect.any(Object))
    
    // Snapshot for Week 3 (Apr 12) should be 0 for this task
    const allArgs = upsertMock.mock.calls[0][0] as any[]
    const week3 = allArgs.find(a => a.week_start === '2026-04-12')
    expect(week3.allocated_hours).toBe(0)
  })
})
