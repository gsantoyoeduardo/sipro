import api from './axios'

export interface Rol {
  idrol: string
  nombre: string
  descripcion: string
  estado: boolean
  permisos: string[]
}

export interface RolFormData {
  nombre: string
  descripcion?: string
  estado?: boolean
}

export const rolService = {
  listar: () => api.get<{ results: Rol[] }>('/portal/api/roles/'),
  detalle: (id: string) => api.get<Rol>(`/portal/api/roles/${id}/`),
  registrar: (data: RolFormData) => api.post('/portal/api/roles/registro/', data),
  editar: (id: string, data: Partial<RolFormData>) => api.put(`/portal/api/roles/${id}/editar/`, data),
  asignarPermisos: (id: string, permisos: string[]) =>
    api.post(`/portal/api/roles/${id}/permisos/`, { permisos }),
}
