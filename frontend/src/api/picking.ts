import api from './axios'
import type { OrdenPicking, DetallePickingItem, IncidenciaItem, ApiListResponse } from '../types'

export const pickingService = {
  list: (idalmacen?: string, estado?: string) =>
    api.get<ApiListResponse<OrdenPicking>>('/ordenes-picking/', { params: { idalmacen, estado } }),
  get: (id: string) => api.get<OrdenPicking>(`/ordenes-picking/${id}/`),
  create: (data: Record<string, unknown>) => api.post<OrdenPicking>('/ordenes-picking/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<OrdenPicking>(`/ordenes-picking/${id}/`, data),
  remove: (id: string) => api.delete(`/ordenes-picking/${id}/`),
  iniciar: (id: string) => api.post(`/ordenes-picking/${id}/iniciar/`),
  completar: (id: string) => api.post(`/ordenes-picking/${id}/completar/`),
  cancelar: (id: string) => api.post(`/ordenes-picking/${id}/cancelar/`),
  getDetalles: (id: string) => api.get<DetallePickingItem[]>(`/ordenes-picking/${id}/detalles/`),
  createDetalle: (id: string, data: Record<string, unknown>) => api.post<DetallePickingItem>(`/ordenes-picking/${id}/detalles/`, data),
}

export const detallePickingService = {
  list: (idorden?: string) => api.get<ApiListResponse<DetallePickingItem>>('/detalles-picking/', { params: idorden ? { idorden } : {} }),
  pick: (id: string, cantidad: number) => api.post<DetallePickingItem>(`/detalles-picking/${id}/pick/`, { cantidad }),
  reportarIncidencia: (id: string, data: Record<string, unknown>) => api.post<IncidenciaItem>(`/detalles-picking/${id}/incidencias/`, data),
  getIncidencias: (id: string) => api.get<IncidenciaItem[]>(`/detalles-picking/${id}/incidencias/`),
}

export const incidenciaService = {
  resolver: (id: string) => api.post(`/incidencias/${id}/resolver/`),
}
