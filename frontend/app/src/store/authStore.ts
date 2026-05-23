import { create } from 'zustand'

interface User {
  idusuario: string
  tipo_usuario: string
  nombres: string
  apellidos: string
  correo: string
  usuario: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  tenantId: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string, tenantId: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  tenantId: localStorage.getItem('tenant_id'),
  setAuth: (user, accessToken, refreshToken, tenantId) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('tenant_id', tenantId)
    set({ user, isAuthenticated: true, tenantId })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('tenant_id')
    set({ user: null, isAuthenticated: false, tenantId: null })
  },
}))
