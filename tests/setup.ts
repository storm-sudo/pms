import '@testing-library/jest-dom'
import { vi, beforeAll, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// 1. Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: {}, error: null })),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    })),
    auth: {
      getSession: vi.fn().mockImplementation(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockImplementation(() => Promise.resolve({ data: { path: 'test' }, error: null })),
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
  })
}))

// 2. Mock Fetch (for Resend/Notify API)
global.fetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as unknown as typeof fetch

// 3. Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 4. Mock sonner and toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}))

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}))

// 5. Global renderWithProviders
// export function renderWithProviders(ui: React.ReactElement) {
//   return render(
//     <AppProvider>
//       {ui}
//     </AppProvider>
//   )
// }

afterEach(() => {
  vi.clearAllMocks()
})
