import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AdminUser } from '../types'
import { adminApi } from '../lib/api'

interface AuthStore {
  user: AdminUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await adminApi.login(email, password)
          localStorage.setItem('buffalo_admin_token', data.access_token)
          set({ user: data, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('buffalo_admin_token')
        localStorage.removeItem('buffalo_admin_user')
        set({ user: null })
      },

      isAuthenticated: () => !!get().user && !!localStorage.getItem('buffalo_admin_token'),
    }),
    { name: 'buffalo-admin-auth' }
  )
)
