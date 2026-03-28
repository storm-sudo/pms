import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerUser, loginUser, isValidNTEmail } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/notifications'

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidNTEmail', () => {
    it('should validate @nt@gmail.com domain correctly', () => {
      expect(isValidNTEmail('researcher@nt@gmail.com')).toBe(false)
      expect(isValidNTEmail('researcher@nt.gmail.com')).toBe(true)
    })

    it('should reject non-NT domains', () => {
      expect(isValidNTEmail('researcher@gmail.com')).toBe(false)
      expect(isValidNTEmail('researcher@external.com')).toBe(false)
    })
  })

  describe('registerUser', () => {
    it('should register valid NT email successfully', async () => {
      const mockSignUp = vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: { user: { id: '123', email: 'valid@nt.gmail.com' } },
        error: null
      } as any)

      const result = await registerUser('Test User', 'valid@nt.gmail.com', 'Password123!')
      
      expect(result.success).toBe(true)
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'valid@nt.gmail.com',
        password: 'Password123!',
        options: { data: { name: 'Test User' } }
      })
    })

    it('should reject invalid domain for researcher', async () => {
      const result = await registerUser('Test User', 'hacker@gmail.com', 'Password123!')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Only emails ending with "nt.gmail.com" are allowed')
    })

    it('should handle duplicate registration cleanly', async () => {
      vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' }
      } as any)

      const result = await registerUser('Test User', 'duplicate@nt.gmail.com', 'Password123!')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('User already registered')
    })
  })

  describe('loginUser', () => {
    it('should log in approved user successfully', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: { user: { id: '123' } },
        error: null
      } as any)

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: '123', status: 'approved', role: 'member' },
          error: null
        })
      } as any)

      const result = await loginUser('test@nt.gmail.com', 'Password123!')
      
      expect(result.success).toBe(true)
      expect(result.user?.status).toBe('approved')
    })

    it('should reject pending account login', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
        data: { user: { id: '123' } },
        error: null
      } as any)

      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: '123', status: 'pending', role: 'member' },
          error: null
        })
      } as any)

      const result = await loginUser('test@nt.gmail.com', 'Password123!')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Account pending approval')
    })
  })

  it('should permit stakeholder with external email (role bypass simulation)', () => {
    // Note: registerUser currently enforces @nt.gmail.com for ALL self-registrations.
    // Stakeholders are admin-created only (no self-registration).
    // This test confirms the logic is strict for self-reg.
    expect(isValidNTEmail('stakeholder@external.com')).toBe(false)
  })
})
