/**
 * Servicios de API para la gesti\u00f3n de la estructura empresarial.
 * Proporciona servicios CRUD para Empresas, Sucursales y Almacenes,
 * con operaciones de toggle de estado y obtenci\u00f3n de sub-recursos.
 */
import api from './axios'
import type { Empresa, Sucursal, Almacen, ApiListResponse } from '../types'

/** Servicio CRUD para Empresas */
export const empresaService = {
  list: () => api.get<ApiListResponse<Empresa>>('/tenant/api/empresas/'),
  get: (id: string) => api.get<Empresa>(`/tenant/api/empresas/${id}/`),
  create: (data: Partial<Empresa>) => api.post<Empresa>('/tenant/api/empresas/', data),
  update: (id: string, data: Partial<Empresa>) => api.put<Empresa>(`/tenant/api/empresas/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Empresa>) => api.patch<Empresa>(`/tenant/api/empresas/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/empresas/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/empresas/${id}/toggle_estado/`),
  getSucursales: (id: string) => api.get<Sucursal[]>(`/tenant/api/empresas/${id}/sucursales/`),
  createSucursal: (id: string, data: Partial<Sucursal>) => api.post<Sucursal>(`/tenant/api/empresas/${id}/sucursales/`, data),
  getAlmacenes: (id: string) => api.get<Almacen[]>(`/tenant/api/empresas/${id}/almacenes/`),
  createAlmacen: (id: string, data: Partial<Almacen>) => api.post<Almacen>(`/tenant/api/empresas/${id}/almacenes/`, data),
}

/** Servicio CRUD para Sucursales */
export const sucursalService = {
  list: () => api.get<ApiListResponse<Sucursal>>('/tenant/api/sucursales/'),
  get: (id: string) => api.get<Sucursal>(`/tenant/api/sucursales/${id}/`),
  create: (data: Partial<Sucursal>) => api.post<Sucursal>('/tenant/api/sucursales/', data),
  update: (id: string, data: Partial<Sucursal>) => api.put<Sucursal>(`/tenant/api/sucursales/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Sucursal>) => api.patch<Sucursal>(`/tenant/api/sucursales/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/sucursales/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/sucursales/${id}/toggle_estado/`),
  getAlmacenes: (id: string) => api.get<Almacen[]>(`/tenant/api/sucursales/${id}/almacenes/`),
  createAlmacen: (id: string, data: Partial<Almacen>) => api.post<Almacen>(`/tenant/api/sucursales/${id}/almacenes/`, data),
}

/** Servicio CRUD para Almacenes */
export const almacenService = {
  list: () => api.get<ApiListResponse<Almacen>>('/tenant/api/almacenes/'),
  get: (id: string) => api.get<Almacen>(`/tenant/api/almacenes/${id}/`),
  create: (data: Partial<Almacen>) => api.post<Almacen>('/tenant/api/almacenes/', data),
  update: (id: string, data: Partial<Almacen>) => api.put<Almacen>(`/tenant/api/almacenes/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Almacen>) => api.patch<Almacen>(`/tenant/api/almacenes/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/almacenes/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/almacenes/${id}/toggle_estado/`),
}
