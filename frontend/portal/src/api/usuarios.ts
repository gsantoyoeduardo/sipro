import api from './axios'

export interface Usuario {
  idusuario: string
  usuario: string
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  estado: boolean
  tipo_usuario: string
  fechacreacion: string
  ultimologin: string | null
  roles: string[]
}

export interface UsuarioFormData {
  usuario: string
  nombres: string
  apellidos: string
  correo: string
  password?: string
  telefono?: string
  tipo_usuario?: string
  estado?: boolean
}

export const usuarioService = {
  listar: () => api.get<{ results: Usuario[] }>('/portal/api/usuarios/'),
  detalle: (id: string) => api.get<Usuario>(`/portal/api/usuarios/${id}/`),
  me: () => api.get<Usuario>('/portal/auth/me/'),
  registrar: (data: UsuarioFormData) => api.post('/portal/api/usuarios/registro/', data),
  editar: (id: string, data: Partial<UsuarioFormData>) => api.put(`/portal/api/usuarios/${id}/editar/`, data),
  restablecerContrasena: (id: string, new_password: string) =>
    api.post(`/portal/api/usuarios/${id}/restablecer-contrasena/`, { new_password }),
  asignarRoles: (id: string, roles: string[]) =>
    api.post(`/portal/api/usuarios/${id}/roles/`, { roles }),
}
