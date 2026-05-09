import api from './axios'
import type { Usuario, Rol, Permiso, SesionUsuario, ApiListResponse } from '../types'

export const usuarioService = {
  list: () => api.get<ApiListResponse<Usuario>>('/usuarios/'),
  get: (id: string) => api.get<Usuario>(`/usuarios/${id}/`),
  create: (data: Partial<Usuario>) => api.post<Usuario>('/usuarios/', data),
  update: (id: string, data: Partial<Usuario>) => api.put<Usuario>(`/usuarios/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Usuario>) => api.patch<Usuario>(`/usuarios/${id}/`, data),
  remove: (id: string) => api.delete(`/usuarios/${id}/`),
  toggleEstado: (id: string) => api.post(`/usuarios/${id}/toggle_estado/`),
  resetPassword: (id: string) => api.post(`/usuarios/${id}/reset_password/`),
  getPermisos: (id: string) => api.get<Permiso[]>(`/usuarios/${id}/permisos/`),
  asignarRoles: (id: string, roles: string[]) => api.post(`/usuarios/${id}/asignar_roles/`, { roles }),
}

export const rolService = {
  list: () => api.get<ApiListResponse<Rol>>('/roles/'),
  get: (id: string) => api.get<Rol>(`/roles/${id}/`),
  create: (data: Partial<Rol>) => api.post<Rol>('/roles/', data),
  update: (id: string, data: Partial<Rol>) => api.put<Rol>(`/roles/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Rol>) => api.patch<Rol>(`/roles/${id}/`, data),
  remove: (id: string) => api.delete(`/roles/${id}/`),
  toggleEstado: (id: string) => api.post(`/roles/${id}/toggle_estado/`),
  asignarPermisos: (id: string, permisos: string[]) => api.post(`/roles/${id}/asignar_permisos/`, { permisos }),
  removePermiso: (id: string, permisoId: string) => api.post(`/roles/${id}/remove_permiso/`, { permiso_id: permisoId }),
}

export const permisoService = {
  list: () => api.get<ApiListResponse<Permiso>>('/permisos/'),
}

export const sesionService = {
  list: (activa?: boolean) => {
    const params = activa !== undefined ? `?activa=${activa}` : ''
    return api.get<ApiListResponse<SesionUsuario>>(`/sesiones/${params}`)
  },
  forceClose: (id: string) => api.post(`/sesiones/${id}/force_close/`),
}
