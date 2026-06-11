'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, getOrCreateGuestSessionId, clearGuestSessionId } from '@/lib/api'
import type { AuthUser, AuthResponse } from '@/lib/api-types'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

// Runs before auth state flips to authenticated, so the new access token
// must be passed explicitly rather than read from persisted storage.
async function mergeGuestCart(accessToken: string) {
  try {
    const sessionId = getOrCreateGuestSessionId()
    await fetch(`${BASE_URL}/cart/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ sessionId }),
    })
    clearGuestSessionId()
  } catch { /* ignore — guest cart merge is best-effort */ }
}

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
        const res = await api.post<{ data: AuthResponse } | AuthResponse>(
          '/auth/login',
          { email, password },
        )
        const payload = (res as { data: AuthResponse }).data ?? (res as AuthResponse)
        await mergeGuestCart(payload.tokens.accessToken)
        set({
          user: payload.user,
          accessToken: payload.tokens.accessToken,
          refreshToken: payload.tokens.refreshToken,
          isAuthenticated: true,
        })
      },

      register: async (data) => {
        const res = await api.post<{ data: AuthResponse } | AuthResponse>(
          '/auth/register',
          data,
        )
        const payload = (res as { data: AuthResponse }).data ?? (res as AuthResponse)
        await mergeGuestCart(payload.tokens.accessToken)
        set({
          user: payload.user,
          accessToken: payload.tokens.accessToken,
          refreshToken: payload.tokens.refreshToken,
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
