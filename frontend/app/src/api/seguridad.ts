import api from './axios'
import type { Usuario, Rol, Permiso, SesionUsuario, ApiListResponse } from '../types'

export const usuarioService = {
  list: () => api.get<ApiListResponse<Usuario>>('/tenant/api/usuarios/'),
  get: (id: string) => api.get<Usuario>(`/tenant/api/usuarios/${id}/`),
  create: (data: Partial<Usuario>) => api.post<Usuario>('/tenant/api/usuarios/', data),
  update: (id: string, data: Partial<Usuario>) => api.put<Usuario>(`/tenant/api/usuarios/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Usuario>) => api.patch<Usuario>(`/tenant/api/usuarios/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/usuarios/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/usuarios/${id}/toggle_estado/`),
  resetPassword: (id: string) => api.post(`/tenant/api/usuarios/${id}/reset_password/`),
  getPermisos: (id: string) => api.get<Permiso[]>(`/tenant/api/usuarios/${id}/permisos/`),
  asignarRoles: (id: string, roles: string[]) => api.post(`/tenant/api/usuarios/${id}/asignar_roles/`, { roles }),
}

export const rolService = {
  list: () => api.get<ApiListResponse<Rol>>('/tenant/api/roles/'),
  get: (id: string) => api.get<Rol>(`/tenant/api/roles/${id}/`),
  create: (data: Partial<Rol>) => api.post<Rol>('/tenant/api/roles/', data),
  update: (id: string, data: Partial<Rol>) => api.put<Rol>(`/tenant/api/roles/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Rol>) => api.patch<Rol>(`/tenant/api/roles/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/roles/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/roles/${id}/toggle_estado/`),
  asignarPermisos: (id: string, permisos: string[]) => api.post(`/tenant/api/roles/${id}/asignar_permisos/`, { permisos }),
  removePermiso: (id: string, permisoId: string) => api.post(`/tenant/api/roles/${id}/remove_permiso/`, { permiso_id: permisoId }),
}

export const permisoService = {
  list: () => api.get<ApiListResponse<Permiso>>('/tenant/api/permisos/'),
}

export const sesionService = {
  list: (activa?: boolean) => {
    const params = activa !== undefined ? `?activa=${activa}` : ''
    return api.get<ApiListResponse<SesionUsuario>>(`/tenant/api/sesiones/${params}`)
  },
  forceClose: (id: string) => api.post(`/tenant/api/sesiones/${id}/force_close/`),
}
