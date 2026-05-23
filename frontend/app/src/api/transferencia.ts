/**
 * Servicios de API para la gesti\u00f3n de Transferencias entre almacenes.
 * Maneja el CRUD de transferencias, el flujo de estado (enviar, recibir, rechazar)
 * y la gesti\u00f3n de detalles (l\u00edneas) de cada transferencia.
 */
import api from './axios'
import type { Transferencia, DetalleTransferenciaItem, ApiListResponse } from '../types'

/** Servicio CRUD y de flujo de estado para Transferencias */
export const transferenciaService = {
  list: (estado?: string, origen?: string) => api.get<ApiListResponse<Transferencia>>('/tenant/api/transferencias/', { params: { estado, origen } }),
  get: (id: string) => api.get<Transferencia>(/tenant/api/transferencias//),
  create: (data: Record<string, unknown>) => api.post<Transferencia>('/tenant/api/transferencias/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Transferencia>(/tenant/api/transferencias//, data),
  remove: (id: string) => api.delete(/tenant/api/transferencias//),
  enviar: (id: string) => api.post(/tenant/api/transferencias//enviar/),
  recibir: (id: string) => api.post(/tenant/api/transferencias//recibir/),
  rechazar: (id: string) => api.post(/tenant/api/transferencias//rechazar/),
  getDetalles: (id: string) => api.get<DetalleTransferenciaItem[]>(/tenant/api/transferencias//detalles/),
  createDetalle: (id: string, data: Record<string, unknown>) => api.post<DetalleTransferenciaItem>(/tenant/api/transferencias//detalles/, data),
}
