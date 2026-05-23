import api from './axios'

/** Datos básicos de una empresa registrada en el sistema */
export interface Empresa {
  idempresa: string
  razonsocial: string
  nombrecomercial: string
  ruc: string
  correo: string
  telefono: string
  direccion: string
  estado: boolean         // true = activa, false = inactiva
  fechacreacion: string
}

/** Estadísticas globales del dashboard */
export interface Stats {
  total_empresas: number
  total_usuarios: number
  empresas_activas: number
  empresas_inactivas: number
}

/** Detalle completo de una empresa, incluyendo su administrador */
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

/** Datos necesarios para crear una nueva empresa con su admin inicial */
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

/** Servicio de operaciones CRUD sobre empresas */
export const empresaService = {
  /**
   * Obtiene la lista paginada de empresas.
   * Endpoint: GET /portal/api/empresas/
   */
  list: () => api.get<{ results: Empresa[] }>('/portal/api/empresas/'),

  /**
   * Obtiene las estadísticas de empresas y usuarios.
   * Endpoint: GET /portal/api/registro/stats/
   */
  stats: () => api.get<Stats>('/portal/api/registro/stats/'),

  /**
   * Crea una nueva empresa con su administrador inicial.
   * Endpoint: POST /portal/api/registro/
   * @param data - Datos de la empresa y del admin
   */
  crear: (data: CrearEmpresaData) => api.post('/portal/api/registro/', data),

  /**
   * Cambia el estado (activo/inactivo) de una empresa.
   * Endpoint: PATCH /portal/api/registro/{id}/toggle/
   * @param id - ID de la empresa
   */
  toggle: (id: string) => api.patch(`/portal/api/registro/${id}/toggle/`),

  /**
   * Obtiene el detalle completo de una empresa.
   * Endpoint: GET /portal/api/registro/{id}/detalle/
   * @param id - ID de la empresa
   */
  detalle: (id: string) => api.get<EmpresaDetalle>(`/portal/api/registro/${id}/detalle/`),
}
