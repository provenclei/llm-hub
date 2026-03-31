import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
  role: string
  balance: number
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

interface DashboardState {
  stats: {
    total_users: number
    total_api_keys: number
    total_requests_30d: number
    total_revenue_30d: number
    total_tokens_30d: number
  } | null
  setStats: (stats: any) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  setStats: (stats) => set({ stats }),
}))
