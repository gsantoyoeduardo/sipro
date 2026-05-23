/**
 * Servicios de API para la gesti\u00f3n de Picking.
 * Maneja \u00f3rdenes de picking, detalle de picking e incidencias.
 * Permite listar, crear, iniciar, completar, cancelar \u00f3rdenes,
 * registrar picks e incidencias sobre los detalles.
 */
import api from './axios'
import type { OrdenPicking, DetallePickingItem, IncidenciaItem, ApiListResponse } from '../types'

/** Servicio CRUD y de flujo de estado para \u00f3rdenes de picking */
export const pickingService = {
  list: (idalmacen?: string, estado?: string) =>
    api.get<ApiListResponse<OrdenPicking>>('/tenant/api/ordenes-picking/', { params: { idalmacen, estado } }),
  get: (id: string) => api.get<OrdenPicking>(/tenant/api/ordenes-picking//),
  create: (data: Record<string, unknown>) => api.post<OrdenPicking>('/tenant/api/ordenes-picking/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<OrdenPicking>(/tenant/api/ordenes-picking//, data),
  remove: (id: string) => api.delete(/tenant/api/ordenes-picking//),
  iniciar: (id: string) => api.post(/tenant/api/ordenes-picking//iniciar/),
  completar: (id: string) => api.post(/tenant/api/ordenes-picking//completar/),
  cancelar: (id: string) => api.post(/tenant/api/ordenes-picking//cancelar/),
  getDetalles: (id: string) => api.get<DetallePickingItem[]>(/tenant/api/ordenes-picking//detalles/),
  createDetalle: (id: string, data: Record<string, unknown>) => api.post<DetallePickingItem>(/tenant/api/ordenes-picking//detalles/, data),
}

/** Servicio para gestionar los detalles (l\u00edneas) de una orden de picking */
export const detallePickingService = {
  list: (idorden?: string) => api.get<ApiListResponse<DetallePickingItem>>('/tenant/api/detalles-picking/', { params: idorden ? { idorden } : {} }),
  pick: (id: string, cantidad: number) => api.post<DetallePickingItem>(/tenant/api/detalles-picking//pick/, { cantidad }),
  reportarIncidencia: (id: string, data: Record<string, unknown>) => api.post<IncidenciaItem>(/tenant/api/detalles-picking//incidencias/, data),
  getIncidencias: (id: string) => api.get<IncidenciaItem[]>(/tenant/api/detalles-picking//incidencias/),
}

/** Servicio para resolver incidencias reportadas en el picking */
export const incidenciaService = {
  resolver: (id: string) => api.post(/tenant/api/incidencias//resolver/),
}
