import { create } from 'zustand'
import type { Usuario } from '../types'

interface AuthState {
  user: Usuario | null
  isAuthenticated: boolean
  setAuth: (user: Usuario, accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })(),
  isAuthenticated: !!localStorage.getItem('access_token'),
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('tenant_id')
    set({ user: null, isAuthenticated: false })
    window.location.href = '/login'
  },
}))
