import api from './axios'
import type { Categoria, Producto, Lote, InventarioItem, KardexItem, PickingResult, ApiListResponse } from '../types'

export const categoriaService = {
  list: (raiz?: boolean) => api.get<ApiListResponse<Categoria>>('/categorias/', { params: raiz ? { raiz: 'true' } : {} }),
  get: (id: string) => api.get<Categoria>(`/categorias/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Categoria>('/categorias/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Categoria>(`/categorias/${id}/`, data),
  remove: (id: string) => api.delete(`/categorias/${id}/`),
  toggleEstado: (id: string) => api.patch(`/categorias/${id}/estado/`),
  getSubcategorias: (id: string) => api.get<Categoria[]>(`/categorias/${id}/subcategorias/`),
  getProductos: (id: string) => api.get<Producto[]>(`/categorias/${id}/productos/`),
}

export const productoService = {
  list: (idcategoria?: string, search?: string) => api.get<ApiListResponse<Producto>>('/productos/', { params: { idcategoria, search } }),
  get: (id: string) => api.get<Producto>(`/productos/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Producto>('/productos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Producto>(`/productos/${id}/`, data),
  remove: (id: string) => api.delete(`/productos/${id}/`),
  toggleEstado: (id: string) => api.patch(`/productos/${id}/estado/`),
  getLotes: (id: string) => api.get<Lote[]>(`/productos/${id}/lotes/`),
  getInventario: (id: string) => api.get<InventarioItem[]>(`/productos/${id}/inventario/`),
  getKardex: (id: string) => api.get<KardexItem[]>(`/productos/${id}/kardex/`),
}

export const loteService = {
  list: (idproducto?: string) => api.get<ApiListResponse<Lote>>('/lotes/', { params: idproducto ? { idproducto } : {} }),
  get: (id: string) => api.get<Lote>(`/lotes/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Lote>('/lotes/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Lote>(`/lotes/${id}/`, data),
  remove: (id: string) => api.delete(`/lotes/${id}/`),
  toggleEstado: (id: string) => api.patch(`/lotes/${id}/estado/`),
}

export const inventarioService = {
  list: (idproducto?: string, idubicacion?: string) => api.get<ApiListResponse<InventarioItem>>('/inventarios/', { params: { idproducto, idubicacion } }),
  get: (id: string) => api.get<InventarioItem>(`/inventarios/${id}/`),
  create: (data: Record<string, unknown>) => api.post<InventarioItem>('/inventarios/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<InventarioItem>(`/inventarios/${id}/`, data),
  remove: (id: string) => api.delete(`/inventarios/${id}/`),
  toggleEstado: (id: string) => api.patch(`/inventarios/${id}/estado/`),
  picking: (producto: string, cantidad: number, estrategia?: string) =>
    api.get<PickingResult>('/inventarios/picking/', { params: { producto, cantidad, estrategia: estrategia || 'fefo' } }),
}

export const kardexService = {
  list: (idproducto?: string, tipo?: string) => api.get<ApiListResponse<KardexItem>>('/kardex/', { params: { idproducto, tipo } }),
}
