import api from './axios'
import type { OrdenPicking, DetallePickingItem, IncidenciaItem, ApiListResponse } from '../types'

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

export const detallePickingService = {
  list: (idorden?: string) => api.get<ApiListResponse<DetallePickingItem>>('/tenant/api/detalles-picking/', { params: idorden ? { idorden } : {} }),
  pick: (id: string, cantidad: number) => api.post<DetallePickingItem>(`/tenant/api/detalles-picking/${id}/pick/`, { cantidad }),
  reportarIncidencia: (id: string, data: Record<string, unknown>) => api.post<IncidenciaItem>(`/tenant/api/detalles-picking/${id}/incidencias/`, data),
  getIncidencias: (id: string) => api.get<IncidenciaItem[]>(`/tenant/api/detalles-picking/${id}/incidencias/`),
}

export const incidenciaService = {
  resolver: (id: string) => api.post(`/tenant/api/incidencias/${id}/resolver/`),
}
