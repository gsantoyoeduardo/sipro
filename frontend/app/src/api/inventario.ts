/**
 * Servicios de API para la gesti\u00f3n de Inventario.
 * Proporciona servicios CRUD para categor\u00edas, productos, lotes,
 * inventario y kardex, adem\u00e1s de operaciones de picking y consulta
 * de sub-recursos como subcategor\u00edas y movimientos.
 */
import api from './axios'
import type { Categoria, Producto, Lote, InventarioItem, KardexItem, PickingResult, ApiListResponse } from '../types'

/** Servicio CRUD para Categor\u00edas de productos */
export const categoriaService = {
  list: (raiz?: boolean) => api.get<ApiListResponse<Categoria>>('/tenant/api/categorias/', { params: raiz ? { raiz: 'true' } : {} }),
  get: (id: string) => api.get<Categoria>(/tenant/api/categorias//),
  create: (data: Record<string, unknown>) => api.post<Categoria>('/tenant/api/categorias/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Categoria>(/tenant/api/categorias//, data),
  remove: (id: string) => api.delete(/tenant/api/categorias//),
  toggleEstado: (id: string) => api.patch(/tenant/api/categorias//estado/),
  getSubcategorias: (id: string) => api.get<Categoria[]>(/tenant/api/categorias//subcategorias/),
  getProductos: (id: string) => api.get<Producto[]>(/tenant/api/categorias//productos/),
}

/** Servicio CRUD para Productos */
export const productoService = {
  list: (idcategoria?: string, search?: string) => api.get<ApiListResponse<Producto>>('/tenant/api/productos/', { params: { idcategoria, search } }),
  get: (id: string) => api.get<Producto>(/tenant/api/productos//),
  create: (data: Record<string, unknown>) => api.post<Producto>('/tenant/api/productos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Producto>(/tenant/api/productos//, data),
  remove: (id: string) => api.delete(/tenant/api/productos//),
  toggleEstado: (id: string) => api.patch(/tenant/api/productos//estado/),
  getLotes: (id: string) => api.get<Lote[]>(/tenant/api/productos//lotes/),
  getInventario: (id: string) => api.get<InventarioItem[]>(/tenant/api/productos//inventario/),
  getKardex: (id: string) => api.get<KardexItem[]>(/tenant/api/productos//kardex/),
}

/** Servicio CRUD para Lotes de productos */
export const loteService = {
  list: (idproducto?: string) => api.get<ApiListResponse<Lote>>('/tenant/api/lotes/', { params: idproducto ? { idproducto } : {} }),
  get: (id: string) => api.get<Lote>(/tenant/api/lotes//),
  create: (data: Record<string, unknown>) => api.post<Lote>('/tenant/api/lotes/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Lote>(/tenant/api/lotes//, data),
  remove: (id: string) => api.delete(/tenant/api/lotes//),
  toggleEstado: (id: string) => api.patch(/tenant/api/lotes//estado/),
}

/** Servicio CRUD para Inventario (stock en ubicaciones) */
export const inventarioService = {
  list: (idproducto?: string, idubicacion?: string) => api.get<ApiListResponse<InventarioItem>>('/tenant/api/inventarios/', { params: { idproducto, idubicacion } }),
  get: (id: string) => api.get<InventarioItem>(/tenant/api/inventarios//),
  create: (data: Record<string, unknown>) => api.post<InventarioItem>('/tenant/api/inventarios/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<InventarioItem>(/tenant/api/inventarios//, data),
  remove: (id: string) => api.delete(/tenant/api/inventarios//),
  toggleEstado: (id: string) => api.patch(/tenant/api/inventarios//estado/),
  picking: (producto: string, cantidad: number, estrategia?: string) =>
    api.get<PickingResult>('/tenant/api/inventarios/picking/', { params: { producto, cantidad, estrategia: estrategia || 'fefo' } }),
}

/** Servicio de consulta de Kardex (historial de movimientos de inventario) */
export const kardexService = {
  list: (idproducto?: string, tipo?: string) => api.get<ApiListResponse<KardexItem>>('/tenant/api/kardex/', { params: { idproducto, tipo } }),
}
