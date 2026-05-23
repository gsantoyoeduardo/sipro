/**
 * Store de autenticaci\u00f3n (Zustand).
 * Gestiona el estado global de autenticaci\u00f3n del usuario: datos del usuario,
 * tokens de acceso/refresh, y tenant activo. Persiste en localStorage.
 */
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
  // Inicializa el estado desde localStorage (persistencia)
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  tenantId: localStorage.getItem('tenant_id'),

  // Almacena credenciales y datos del usuario en localStorage y estado
  setAuth: (user, accessToken, refreshToken, tenantId) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('tenant_id', tenantId)
    set({ user, isAuthenticated: true, tenantId })
  },

  // Elimina credenciales y datos del usuario, revierte el estado
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('tenant_id')
    set({ user: null, isAuthenticated: false, tenantId: null })
  },
}))
