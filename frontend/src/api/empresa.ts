import api from './axios'
import type { Empresa, Sucursal, Almacen, ApiListResponse } from '../types'

export const empresaService = {
  list: () => api.get<ApiListResponse<Empresa>>('/empresas/'),
  get: (id: string) => api.get<Empresa>(`/empresas/${id}/`),
  create: (data: Partial<Empresa>) => api.post<Empresa>('/empresas/', data),
  update: (id: string, data: Partial<Empresa>) => api.put<Empresa>(`/empresas/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Empresa>) => api.patch<Empresa>(`/empresas/${id}/`, data),
  remove: (id: string) => api.delete(`/empresas/${id}/`),
  toggleEstado: (id: string) => api.post(`/empresas/${id}/toggle_estado/`),
  getSucursales: (id: string) => api.get<Sucursal[]>(`/empresas/${id}/sucursales/`),
  createSucursal: (id: string, data: Partial<Sucursal>) => api.post<Sucursal>(`/empresas/${id}/sucursales/`, data),
  getAlmacenes: (id: string) => api.get<Almacen[]>(`/empresas/${id}/almacenes/`),
  createAlmacen: (id: string, data: Partial<Almacen>) => api.post<Almacen>(`/empresas/${id}/almacenes/`, data),
}

export const sucursalService = {
  list: () => api.get<ApiListResponse<Sucursal>>('/sucursales/'),
  get: (id: string) => api.get<Sucursal>(`/sucursales/${id}/`),
  create: (data: Partial<Sucursal>) => api.post<Sucursal>('/sucursales/', data),
  update: (id: string, data: Partial<Sucursal>) => api.put<Sucursal>(`/sucursales/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Sucursal>) => api.patch<Sucursal>(`/sucursales/${id}/`, data),
  remove: (id: string) => api.delete(`/sucursales/${id}/`),
  toggleEstado: (id: string) => api.post(`/sucursales/${id}/toggle_estado/`),
  getAlmacenes: (id: string) => api.get<Almacen[]>(`/sucursales/${id}/almacenes/`),
  createAlmacen: (id: string, data: Partial<Almacen>) => api.post<Almacen>(`/sucursales/${id}/almacenes/`, data),
}

export const almacenService = {
  list: () => api.get<ApiListResponse<Almacen>>('/almacenes/'),
  get: (id: string) => api.get<Almacen>(`/almacenes/${id}/`),
  create: (data: Partial<Almacen>) => api.post<Almacen>('/almacenes/', data),
  update: (id: string, data: Partial<Almacen>) => api.put<Almacen>(`/almacenes/${id}/`, data),
  partialUpdate: (id: string, data: Partial<Almacen>) => api.patch<Almacen>(`/almacenes/${id}/`, data),
  remove: (id: string) => api.delete(`/almacenes/${id}/`),
  toggleEstado: (id: string) => api.post(`/almacenes/${id}/toggle_estado/`),
}
