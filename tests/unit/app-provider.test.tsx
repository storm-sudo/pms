import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../setup'
import { useApp } from '@/lib/store'
import { supabaseService } from '@/lib/supabase-service'
import React from 'react'

const TestComponent = () => {
  const { startTimer, stopTimer, timer, submitForApproval, approvalRequests } = useApp()
  return (
    <div>
      <div data-testid="timer-status">{timer.isRunning ? 'running' : 'stopped'}</div>
      <div data-testid="active-task">{timer.activeTaskId}</div>
      <div data-testid="approval-count">{approvalRequests.length}</div>
      <button onClick={() => startTimer('task-123')}>Start Timer</button>
      <button onClick={() => stopTimer()}>Stop Timer</button>
      <button onClick={() => submitForApproval('task-123', 'admin-1', 'task_completion')}>Request Approval</button>
    </div>
  )
}

describe('AppProvider Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Timer Logic', () => {
    it('should start timer and update state correctly', async () => {
      renderWithProviders(<TestComponent />)
      
      const startBtn = screen.getByText('Start Timer')
      fireEvent.click(startBtn)

      expect(screen.getByTestId('timer-status')).toHaveTextContent('running')
      expect(screen.getByTestId('active-task')).toHaveTextContent('task-123')
    })

    it('should call addTaskLog with correct hours when stopTimer is called', async () => {
      const addTaskLogSpy = vi.spyOn(supabaseService, 'addTaskLog').mockResolvedValue({} as any)
      
      renderWithProviders(<TestComponent />)
      
      fireEvent.click(screen.getByText('Start Timer'))
      
      // Advance timers by 1 hour (3600 seconds)
      vi.useFakeTimers()
      vi.advanceTimersByTime(3600000)
      
      fireEvent.click(screen.getByText('Stop Timer'))

      await waitFor(() => {
        expect(addTaskLogSpy).toHaveBeenCalledWith(expect.objectContaining({
          taskId: 'task-123',
          hoursLogged: 1 // 3600s = 1h
        }), expect.any(String))
      })
      
      expect(screen.getByTestId('timer-status')).toHaveTextContent('stopped')
      vi.useRealTimers()
    })
  })

  describe('Approvals', () => {
    it('should create approval request and update state optimistically', async () => {
      const createApprovalSpy = vi.spyOn(supabaseService, 'createApprovalRequest').mockResolvedValue({
        id: 'new-req',
        taskId: 'task-123',
        status: 'pending'
      } as any)

      renderWithProviders(<TestComponent />)
      
      fireEvent.click(screen.getByText('Request Approval'))

      await waitFor(() => {
        expect(createApprovalSpy).toHaveBeenCalled()
        expect(screen.getByTestId('approval-count')).not.toHaveTextContent('0')
      })
    })
  })
})
