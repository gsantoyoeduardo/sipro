import api from './axios'
import type { LoginResponse, Usuario } from '../types'

export const authService = {
  login: (usuario: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { usuario, password }),

  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),

  getMe: () =>
    api.get<Usuario>('/auth/me/'),

  updateMe: (data: Partial<Usuario>) =>
    api.put<Usuario>('/auth/me/', data),

  changePassword: (old_password: string, new_password: string) =>
    api.patch('/auth/me/password/', { old_password, new_password }),

  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh }),
}
