import api from './axios'
import type { LoginResponse, Usuario } from '../types'

export const authService = {
  login: (usuario: string, password: string) =>
    api.post<LoginResponse>('/tenant/auth/', { usuario, password }),

  logout: (refresh: string) =>
    api.post('/tenant/auth/logout/', { refresh }),

  getMe: () =>
    api.get<Usuario>('/tenant/auth/me/'),

  updateMe: (data: Partial<Usuario>) =>
    api.put<Usuario>('/tenant/auth/me/', data),

  changePassword: (old_password: string, new_password: string) =>
    api.patch('/tenant/auth/me/password/', { old_password, new_password }),

  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh }),
}
