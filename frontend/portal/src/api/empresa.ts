import api from './axios'

export interface Empresa {
  idempresa: string
  razonsocial: string
  nombrecomercial: string
  ruc: string
  correo: string
  telefono: string
  direccion: string
  estado: boolean
  fechacreacion: string
}

export interface Stats {
  total_empresas: number
  total_usuarios: number
  empresas_activas: number
  empresas_inactivas: number
}

export interface EmpresaDetalle {
  empresa: Empresa
  admin_usuario: {
    idusuario: string
    usuario: string
    nombres: string
    apellidos: string
    correo: string
  } | null
  total_usuarios: number
}

export interface CrearEmpresaData {
  razonsocial: string
  nombrecomercial?: string
  ruc: string
  correo: string
  telefono?: string
  direccion?: string
  admin_usuario: string
  admin_nombres: string
  admin_apellidos: string
  admin_correo: string
  admin_password: string
}

export interface UsuarioEmpresa {
  idusuario: string
  usuario: string
  nombres: string
  apellidos: string
  correo: string
  estado: boolean
  tipo_usuario: string
  fechacreacion: string
}

export const empresaService = {
  registrar: (data: CrearEmpresaData) => api.post('/portal/api/registro/', data),
  listar: () => api.get<{ results: Empresa[] }>('/portal/api/listar/'),
  detalle: (id: string) => api.get<EmpresaDetalle>(`/portal/api/${id}/detalle/`),
  editar: (id: string, data: Partial<Empresa>) => api.put(`/portal/api/${id}/editar/`, data),
  desactivar: (id: string) => api.patch(`/portal/api/${id}/desactivar/`),
  estadisticas: () => api.get<Stats>('/portal/api/estadisticas/'),
  listarUsuarios: (id: string) => api.get<UsuarioEmpresa[]>(`/portal/api/${id}/usuarios/`),
  editarUsuario: (id: string, userId: string, data: Record<string, unknown>) =>
    api.put(`/portal/api/${id}/usuarios/${userId}/editar/`, data),
  sesiones: (id: string) => api.get(`/portal/api/${id}/sesiones/`),
}
