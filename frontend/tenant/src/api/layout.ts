import api from './axios'
import type { Zona, Estante, Nivel, Ubicacion, Nodo, Conexion, RutaResult, ApiListResponse, EstanteSummary } from '../types'

export const zonaService = {
  list: (params?: { idalmacen?: string; idsucursal?: string }) => api.get<ApiListResponse<Zona>>('/tenant/api/zonas/', { params: params || {} }),
  get: (id: string) => api.get<Zona>(`/tenant/api/zonas/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Zona>('/tenant/api/zonas/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Zona>(`/tenant/api/zonas/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/zonas/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/zonas/${id}/estado/`),
  getEstantes: (id: string) => api.get<EstanteSummary[]>(`/tenant/api/zonas/${id}/estantes/`),
  createEstante: (id: string, data: Record<string, unknown>) => api.post<Estante>(`/tenant/api/zonas/${id}/estantes/`, data),
}

export const estanteService = {
  list: (idzona?: string) => api.get<ApiListResponse<Estante>>('/tenant/api/estantes/', { params: idzona ? { idzona } : {} }),
  get: (id: string) => api.get<Estante>(`/tenant/api/estantes/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Estante>('/tenant/api/estantes/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Estante>(`/tenant/api/estantes/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/estantes/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/estantes/${id}/estado/`),
  getNiveles: (id: string) => api.get<Nivel[]>(`/tenant/api/estantes/${id}/niveles/`),
  createNivel: (id: string, data: Record<string, unknown>) => api.post<Nivel>(`/tenant/api/estantes/${id}/niveles/`, data),
}

export const nivelService = {
  list: (idestante?: string) => api.get<ApiListResponse<Nivel>>('/tenant/api/niveles/', { params: idestante ? { idestante } : {} }),
  get: (id: string) => api.get<Nivel>(`/tenant/api/niveles/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Nivel>('/tenant/api/niveles/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Nivel>(`/tenant/api/niveles/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/niveles/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/niveles/${id}/estado/`),
  getUbicaciones: (id: string) => api.get<Ubicacion[]>(`/tenant/api/niveles/${id}/ubicaciones/`),
  createUbicacion: (id: string, data: Partial<Ubicacion>) => api.post<Ubicacion>(`/tenant/api/niveles/${id}/ubicaciones/`, data),
}

export const ubicacionService = {
  list: (idnivel?: string) => api.get<ApiListResponse<Ubicacion>>('/tenant/api/ubicaciones/', { params: idnivel ? { idnivel } : {} }),
  get: (id: string) => api.get<Ubicacion>(`/tenant/api/ubicaciones/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Ubicacion>('/tenant/api/ubicaciones/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Ubicacion>(`/tenant/api/ubicaciones/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/ubicaciones/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/ubicaciones/${id}/estado/`),
  cambiarEstado: (id: string, estado_ubicacion: string) => api.patch(`/tenant/api/ubicaciones/${id}/estado-ubicacion/`, { estado_ubicacion }),
}

export const nodoService = {
  list: (params?: { idalmacen?: string; idsucursal?: string }) => api.get<ApiListResponse<Nodo>>('/tenant/api/nodos/', { params: params || {} }),
  get: (id: string) => api.get<Nodo>(`/tenant/api/nodos/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Nodo>('/tenant/api/nodos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Nodo>(`/tenant/api/nodos/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/nodos/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/nodos/${id}/estado/`),
  getConexiones: (id: string) => api.get<{ salida: Conexion[]; entrada: Conexion[] }>(`/tenant/api/nodos/${id}/conexiones/`),
}

export const conexionService = {
  list: () => api.get<ApiListResponse<Conexion>>('/tenant/api/conexiones/'),
  get: (id: string) => api.get<Conexion>(`/tenant/api/conexiones/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Conexion>('/tenant/api/conexiones/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Conexion>(`/tenant/api/conexiones/${id}/`, data),
  remove: (id: string) => api.delete(`/tenant/api/conexiones/${id}/`),
  toggleEstado: (id: string) => api.post(`/tenant/api/conexiones/${id}/estado/`),
}

export const rutaService = {
  calcular: (origen_id: string, destino_id: string) =>
    api.get<RutaResult>('/tenant/api/rutas/calcular/', { params: { origen_id, destino_id } }),
}
