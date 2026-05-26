import api from './axios'

export interface AuditoriaEntry {
  idauditoria: string
  idregistro: string
  tabla: string
  idusuario: string | null
  tipooperacion: string
  datosanteriores: Record<string, unknown> | null
  datosnuevos: Record<string, unknown> | null
  ip: string | null
  dispositivo: string | null
  fechaevento: string
}

export interface AuditoriaFiltros {
  tipo?: string
  desde?: string
  hasta?: string
}

const TABLAS_AUDITORIA = [
  { value: 'empresas', label: 'Empresas' },
  { value: 'sucursales', label: 'Sucursales' },
  { value: 'almacenes', label: 'Almacenes' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'roles', label: 'Roles' },
  { value: 'permisos', label: 'Permisos' },
  { value: 'usuariorol', label: 'Usuario-Rol' },
  { value: 'rolpermiso', label: 'Rol-Permiso' },
  { value: 'sesiones', label: 'Sesiones' },
  { value: 'categorias', label: 'Categorías' },
  { value: 'productos', label: 'Productos' },
  { value: 'lotes', label: 'Lotes' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'kardex', label: 'Kardex' },
  { value: 'zonas', label: 'Zonas' },
  { value: 'estantes', label: 'Estantes' },
  { value: 'niveles', label: 'Niveles' },
  { value: 'ubicaciones', label: 'Ubicaciones' },
  { value: 'nodos', label: 'Nodos' },
  { value: 'conexiones', label: 'Conexiones' },
  { value: 'ordenes-picking', label: 'Órdenes Picking' },
  { value: 'detalles-picking', label: 'Detalles Picking' },
  { value: 'incidencias', label: 'Incidencias' },
  { value: 'transferencias', label: 'Transferencias' },
  { value: 'detalles-transferencia', label: 'Detalles Transferencia' },
]

export const auditoriaService = {
  TABLAS: TABLAS_AUDITORIA,
  list: (idempresa: string, tabla: string, filtros?: AuditoriaFiltros) =>
    api.get<AuditoriaEntry[]>(`/portal/api/${idempresa}/${tabla}/`, { params: filtros }),
}
