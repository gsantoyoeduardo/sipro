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

export const empresaService = {
  list: () => api.get<{ results: Empresa[] }>('/portal/api/empresas/'),
  stats: () => api.get<Stats>('/portal/api/registro/stats/'),
  crear: (data: CrearEmpresaData) => api.post('/portal/api/registro/', data),
  toggle: (id: string) => api.patch(`/portal/api/registro/${id}/toggle/`),
  detalle: (id: string) => api.get<EmpresaDetalle>(`/portal/api/registro/${id}/detalle/`),
}
