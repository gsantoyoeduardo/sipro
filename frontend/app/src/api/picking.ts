/**
 * Servicios de API para la gestión de Picking.
 * Maneja órdenes de picking, detalle de picking e incidencias.
 * Permite listar, crear, iniciar, completar, cancelar órdenes,
 * registrar picks e incidencias sobre los detalles.
 */
import api from './axios'
import type { OrdenPicking, DetallePickingItem, IncidenciaItem, ApiListResponse } from '../types'

/** Servicio CRUD y de flujo de estado para órdenes de picking */
export const pickingService = {
  list: (idalmacen?: string, estado?: string) =>
    api.get<ApiListResponse<OrdenPicking>>('/tenant/api/ordenes-picking/', { params: { idalmacen, estado } }),
  get: (id: string) => api.get<OrdenPicking>(`/tenant/api/ordenes-picking/${id}/`),
  create: (data: Record<string, unknown>) => api.post<OrdenPicking>('/tenant/api/ordenes-picking/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<OrdenPicking>(`/tenant/api/ordenes-picking/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/ordenes-picking/${id}/`),
  iniciar: (id: string) => api.post(`/tenant/api/ordenes-picking/${id}/iniciar/`),
  completar: (id: string) => api.post(`/tenant/api/ordenes-picking/${id}/completar/`),
  cancelar: (id: string) => api.post(`/tenant/api/ordenes-picking/${id}/cancelar/`),
  getDetalles: (id: string) => api.get<DetallePickingItem[]>(`/tenant/api/ordenes-picking/${id}/detalles/`),
  createDetalle: (id: string, data: Record<string, unknown>) => api.post<DetallePickingItem>(`/tenant/api/ordenes-picking/${id}/detalles/`, data),
}

/** Servicio para gestionar los detalles (líneas) de una orden de picking */
export const detallePickingService = {
  list: (idorden?: string) => api.get<ApiListResponse<DetallePickingItem>>('/tenant/api/detalles-picking/', { params: idorden ? { idorden } : {} }),
  pick: (id: string, cantidad: number) => api.post<DetallePickingItem>(`/tenant/api/detalles-picking/${id}/pick/`, { cantidad }),
  reportarIncidencia: (id: string, data: Record<string, unknown>) => api.post<IncidenciaItem>(`/tenant/api/detalles-picking/${id}/incidencias/`, data),
  getIncidencias: (id: string) => api.get<IncidenciaItem[]>(`/tenant/api/detalles-picking/${id}/incidencias/`),
}

/** Servicio para resolver incidencias reportadas en el picking */
export const incidenciaService = {
  resolver: (id: string) => api.post(`/tenant/api/incidencias/${id}/resolver/`),
}
