'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'
import type { AuthUser, AuthTokens } from '@/lib/api-types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => Promise<void>
  setTokens: (accessToken: string, refreshToken: string, user: AuthUser) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await api.post<{ data: AuthTokens } | AuthTokens>(
          '/auth/login',
          { email, password },
        )
        const payload = (res as { data: AuthTokens }).data ?? (res as AuthTokens)
        set({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          isAuthenticated: true,
        })
      },

      register: async (data) => {
        const res = await api.post<{ data: AuthTokens } | AuthTokens>(
          '/auth/register',
          data,
        )
        const payload = (res as { data: AuthTokens }).data ?? (res as AuthTokens)
        set({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          isAuthenticated: true,
        })
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch { /* ignore */ }
        get().clear()
      },

      setTokens: (accessToken, refreshToken, user) => {
        set({ accessToken, refreshToken, user, isAuthenticated: true })
      },

      clear: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    { name: 'ap-auth' },
  ),
)
