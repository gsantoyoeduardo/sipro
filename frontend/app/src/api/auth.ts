/**
 * Servicios de API para Autenticaci\u00f3n.
 * Proporciona endpoints para login, logout, refresco de tokens,
 * obtenci\u00f3n y actualizaci\u00f3n del perfil del usuario autenticado,
 * y cambio de contrase\u00f1a.
 */
import api from './axios'
import type { LoginResponse, Usuario } from '../types'

export const authService = {
  /** Autentica al usuario con nombre de usuario y contrase\u00f1a, retorna tokens y datos del usuario */
  login: (usuario: string, password: string) =>
    api.post<LoginResponse>('/tenant/auth/', { usuario, password }),

  /** Cierra la sesi\u00f3n del usuario invalidando el refresh token */
  logout: (refresh: string) =>
    api.post('/tenant/auth/logout/', { refresh }),

  /** Obtiene los datos del usuario autenticado */
  getMe: () =>
    api.get<Usuario>('/tenant/auth/me/'),

  /** Actualiza los datos del perfil del usuario autenticado */
  updateMe: (data: Partial<Usuario>) =>
    api.put<Usuario>('/tenant/auth/me/', data),

  /** Cambia la contrase\u00f1a del usuario autenticado */
  changePassword: (old_password: string, new_password: string) =>
    api.patch('/tenant/auth/me/password/', { old_password, new_password }),

  /** Refresca el token de acceso usando el refresh token */
  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh }),
}
