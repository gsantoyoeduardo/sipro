import api from './axios'
import type { Transferencia, DetalleTransferenciaItem, ApiListResponse } from '../types'

export const transferenciaService = {
  list: (estado?: string, origen?: string) => api.get<ApiListResponse<Transferencia>>('/transferencias/', { params: { estado, origen } }),
  get: (id: string) => api.get<Transferencia>(`/transferencias/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Transferencia>('/transferencias/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Transferencia>(`/transferencias/${id}/`, data),
  remove: (id: string) => api.delete(`/transferencias/${id}/`),
  enviar: (id: string) => api.post(`/transferencias/${id}/enviar/`),
  recibir: (id: string) => api.post(`/transferencias/${id}/recibir/`),
  rechazar: (id: string) => api.post(`/transferencias/${id}/rechazar/`),
  getDetalles: (id: string) => api.get<DetalleTransferenciaItem[]>(`/transferencias/${id}/detalles/`),
  createDetalle: (id: string, data: Record<string, unknown>) => api.post<DetalleTransferenciaItem>(`/transferencias/${id}/detalles/`, data),
}
