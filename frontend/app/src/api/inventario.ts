/**
 * Servicios de API para la gestión de Inventario.
 * Proporciona servicios CRUD para categorías, productos, lotes,
 * inventario y kardex, además de operaciones de picking y consulta
 * de sub-recursos como subcategorías y movimientos.
 */
import api from './axios'
import type { Categoria, Producto, Lote, InventarioItem, KardexItem, PickingResult, ApiListResponse } from '../types'

/** Servicio CRUD para Categorías de productos */
export const categoriaService = {
  list: (raiz?: boolean) => api.get<ApiListResponse<Categoria>>('/tenant/api/categorias/', { params: raiz ? { raiz: 'true' } : {} }),
  get: (id: string) => api.get<Categoria>(`/tenant/api/categorias/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Categoria>('/tenant/api/categorias/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Categoria>(`/tenant/api/categorias/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/categorias/${id}/`),
  toggleEstado: (id: string) => api.patch(`/tenant/api/categorias/${id}/estado/`),
  getSubcategorias: (id: string) => api.get<Categoria[]>(`/tenant/api/categorias/${id}/subcategorias/`),
  getProductos: (id: string) => api.get<Producto[]>(`/tenant/api/categorias/${id}/productos/`),
}

/** Servicio CRUD para Productos */
export const productoService = {
  list: (idcategoria?: string, search?: string) => api.get<ApiListResponse<Producto>>('/tenant/api/productos/', { params: { idcategoria, search } }),
  get: (id: string) => api.get<Producto>(`/tenant/api/productos/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Producto>('/tenant/api/productos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Producto>(`/tenant/api/productos/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/productos/${id}/`),
  toggleEstado: (id: string) => api.patch(`/tenant/api/productos/${id}/estado/`),
  getLotes: (id: string) => api.get<Lote[]>(`/tenant/api/productos/${id}/lotes/`),
  getInventario: (id: string) => api.get<InventarioItem[]>(`/tenant/api/productos/${id}/inventario/`),
  getKardex: (id: string) => api.get<KardexItem[]>(`/tenant/api/productos/${id}/kardex/`),
}

/** Servicio CRUD para Lotes de productos */
export const loteService = {
  list: (idproducto?: string) => api.get<ApiListResponse<Lote>>('/tenant/api/lotes/', { params: idproducto ? { idproducto } : {} }),
  get: (id: string) => api.get<Lote>(`/tenant/api/lotes/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Lote>('/tenant/api/lotes/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Lote>(`/tenant/api/lotes/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/lotes/${id}/`),
  toggleEstado: (id: string) => api.patch(`/tenant/api/lotes/${id}/estado/`),
}

/** Servicio CRUD para Inventario (stock en ubicaciones) */
export const inventarioService = {
  list: (idproducto?: string, idubicacion?: string) => api.get<ApiListResponse<InventarioItem>>('/tenant/api/inventarios/', { params: { idproducto, idubicacion } }),
  get: (id: string) => api.get<InventarioItem>(`/tenant/api/inventarios/${id}/`),
  create: (data: Record<string, unknown>) => api.post<InventarioItem>('/tenant/api/inventarios/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<InventarioItem>(`/tenant/api/inventarios/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/inventarios/${id}/`),
  toggleEstado: (id: string) => api.patch(`/tenant/api/inventarios/${id}/estado/`),
  picking: (producto: string, cantidad: number, estrategia?: string) =>
    api.get<PickingResult>('/tenant/api/inventarios/picking/', { params: { producto, cantidad, estrategia: estrategia || 'fefo' } }),
}

/** Servicio de consulta de Kardex (historial de movimientos de inventario) */
export const kardexService = {
  list: (idproducto?: string, tipo?: string) => api.get<ApiListResponse<KardexItem>>('/tenant/api/kardex/', { params: { idproducto, tipo } }),
}
