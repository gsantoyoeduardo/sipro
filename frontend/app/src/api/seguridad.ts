/**
 * Servicios de API para la gesti\u00f3n de Seguridad.
 * Proporciona servicios CRUD para Usuarios, Roles y Permisos,
 * as\u00ed como gesti\u00f3n de sesiones de usuario activas.
 */
import api from './axios'
import type { Usuario, Rol, Permiso, SesionUsuario, ApiListResponse } from '../types'

/** Servicio CRUD y operaciones espec\u00edficas para Usuarios */
export const usuarioService = {
  list: () => api.get<ApiListResponse<Usuario>>('/tenant/api/usuarios/'),
  get: (id: string) => api.get<Usuario>(/tenant/api/usuarios//),
  create: (data: Partial<Usuario>) => api.post<Usuario>('/tenant/api/usuarios/', data),
  update: (id: string, data: Partial<Usuario>) => api.put<Usuario>(/tenant/api/usuarios//, data),
  partialUpdate: (id: string, data: Partial<Usuario>) => api.patch<Usuario>(/tenant/api/usuarios//, data),
  remove: (id: string) => api.delete(/tenant/api/usuarios//),
  toggleEstado: (id: string) => api.post(/tenant/api/usuarios//toggle_estado/),
  resetPassword: (id: string) => api.post(/tenant/api/usuarios//reset_password/),
  getPermisos: (id: string) => api.get<Permiso[]>(/tenant/api/usuarios//permisos/),
  asignarRoles: (id: string, roles: string[]) => api.post(/tenant/api/usuarios//asignar_roles/, { roles }),
}

/** Servicio CRUD y asignaci\u00f3n de permisos para Roles */
export const rolService = {
  list: () => api.get<ApiListResponse<Rol>>('/tenant/api/roles/'),
  get: (id: string) => api.get<Rol>(/tenant/api/roles//),
  create: (data: Partial<Rol>) => api.post<Rol>('/tenant/api/roles/', data),
  update: (id: string, data: Partial<Rol>) => api.put<Rol>(/tenant/api/roles//, data),
  partialUpdate: (id: string, data: Partial<Rol>) => api.patch<Rol>(/tenant/api/roles//, data),
  remove: (id: string) => api.delete(/tenant/api/roles//),
  toggleEstado: (id: string) => api.post(/tenant/api/roles//toggle_estado/),
  asignarPermisos: (id: string, permisos: string[]) => api.post(/tenant/api/roles//asignar_permisos/, { permisos }),
  removePermiso: (id: string, permisoId: string) => api.post(/tenant/api/roles//remove_permiso/, { permiso_id: permisoId }),
}

/** Servicio de consulta de Permisos disponibles */
export const permisoService = {
  list: () => api.get<ApiListResponse<Permiso>>('/tenant/api/permisos/'),
}

/** Servicio de gesti\u00f3n de Sesiones de usuario */
export const sesionService = {
  list: (activa?: boolean) => {
    const params = activa !== undefined ? ?activa= : ''
    return api.get<ApiListResponse<SesionUsuario>>(/tenant/api/sesiones/)
  },
  forceClose: (id: string) => api.post(/tenant/api/sesiones//force_close/),
}
