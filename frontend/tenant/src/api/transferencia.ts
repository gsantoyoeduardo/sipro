/**
 * Servicios de API para la gestión de Transferencias entre almacenes.
 * Maneja el CRUD de transferencias, el flujo de estado (enviar, recibir, rechazar)
 * y la gestión de detalles (líneas) de cada transferencia.
 */
import api from './axios'
import type { Transferencia, DetalleTransferenciaItem, ApiListResponse } from '../types'

/** Servicio CRUD y de flujo de estado para Transferencias */
export const transferenciaService = {
  list: (estado?: string, origen?: string) => api.get<ApiListResponse<Transferencia>>('/tenant/api/transferencias/', { params: { estado, origen } }),
  get: (id: string) => api.get<Transferencia>(`/tenant/api/transferencias/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Transferencia>('/tenant/api/transferencias/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Transferencia>(`/tenant/api/transferencias/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/transferencias/${id}/`),
  enviar: (id: string) => api.post(`/tenant/api/transferencias/${id}/enviar/`),
  recibir: (id: string) => api.post(`/tenant/api/transferencias/${id}/recibir/`),
  rechazar: (id: string) => api.post(`/tenant/api/transferencias/${id}/rechazar/`),
  getDetalles: (id: string) => api.get<DetalleTransferenciaItem[]>(`/tenant/api/transferencias/${id}/detalles/`),
  createDetalle: (id: string, data: Record<string, unknown>) => api.post<DetalleTransferenciaItem>(`/tenant/api/transferencias/${id}/detalles/`, data),
}
