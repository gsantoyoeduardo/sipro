import api from './axios'
import type { Zona, Pasillo, Estante, Nivel, Ubicacion, Nodo, Conexion, RutaResult, ApiListResponse, PasilloSummary, EstanteSummary } from '../types'

export const zonaService = {
  list: (idalmacen?: string) => api.get<ApiListResponse<Zona>>('/zonas/', { params: idalmacen ? { idalmacen } : {} }),
  get: (id: string) => api.get<Zona>(`/zonas/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Zona>('/zonas/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Zona>(`/zonas/${id}/`, data),
  remove: (id: string) => api.delete(`/zonas/${id}/`),
  toggleEstado: (id: string) => api.post(`/zonas/${id}/estado/`),
  getPasillos: (id: string) => api.get<PasilloSummary[]>(`/zonas/${id}/pasillos/`),
  createPasillo: (id: string, data: Record<string, unknown>) => api.post<Pasillo>(`/zonas/${id}/pasillos/`, data),
}

export const pasilloService = {
  list: (idzona?: string) => api.get<ApiListResponse<Pasillo>>('/pasillos/', { params: idzona ? { idzona } : {} }),
  get: (id: string) => api.get<Pasillo>(`/pasillos/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Pasillo>('/pasillos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Pasillo>(`/pasillos/${id}/`, data),
  remove: (id: string) => api.delete(`/pasillos/${id}/`),
  toggleEstado: (id: string) => api.post(`/pasillos/${id}/estado/`),
  getEstantes: (id: string) => api.get<EstanteSummary[]>(`/pasillos/${id}/estantes/`),
  createEstante: (id: string, data: Record<string, unknown>) => api.post<Estante>(`/pasillos/${id}/estantes/`, data),
}

export const estanteService = {
  list: (idpasillo?: string) => api.get<ApiListResponse<Estante>>('/estantes/', { params: idpasillo ? { idpasillo } : {} }),
  get: (id: string) => api.get<Estante>(`/estantes/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Estante>('/estantes/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Estante>(`/estantes/${id}/`, data),
  remove: (id: string) => api.delete(`/estantes/${id}/`),
  toggleEstado: (id: string) => api.post(`/estantes/${id}/estado/`),
  getNiveles: (id: string) => api.get<Nivel[]>(`/estantes/${id}/niveles/`),
  createNivel: (id: string, data: Record<string, unknown>) => api.post<Nivel>(`/estantes/${id}/niveles/`, data),
}

export const nivelService = {
  list: (idestante?: string) => api.get<ApiListResponse<Nivel>>('/niveles/', { params: idestante ? { idestante } : {} }),
  get: (id: string) => api.get<Nivel>(`/niveles/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Nivel>('/niveles/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Nivel>(`/niveles/${id}/`, data),
  remove: (id: string) => api.delete(`/niveles/${id}/`),
  toggleEstado: (id: string) => api.post(`/niveles/${id}/estado/`),
  getUbicaciones: (id: string) => api.get<Ubicacion[]>(`/niveles/${id}/ubicaciones/`),
  createUbicacion: (id: string, data: Partial<Ubicacion>) => api.post<Ubicacion>(`/niveles/${id}/ubicaciones/`, data),
}

export const ubicacionService = {
  list: (idnivel?: string) => api.get<ApiListResponse<Ubicacion>>('/ubicaciones/', { params: idnivel ? { idnivel } : {} }),
  get: (id: string) => api.get<Ubicacion>(`/ubicaciones/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Ubicacion>('/ubicaciones/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Ubicacion>(`/ubicaciones/${id}/`, data),
  remove: (id: string) => api.delete(`/ubicaciones/${id}/`),
  toggleEstado: (id: string) => api.post(`/ubicaciones/${id}/estado/`),
  cambiarEstado: (id: string, estado_ubicacion: string) => api.patch(`/ubicaciones/${id}/estado-ubicacion/`, { estado_ubicacion }),
}

export const nodoService = {
  list: (idalmacen?: string) => api.get<ApiListResponse<Nodo>>('/nodos/', { params: idalmacen ? { idalmacen } : {} }),
  get: (id: string) => api.get<Nodo>(`/nodos/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Nodo>('/nodos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Nodo>(`/nodos/${id}/`, data),
  remove: (id: string) => api.delete(`/nodos/${id}/`),
  toggleEstado: (id: string) => api.post(`/nodos/${id}/estado/`),
  getConexiones: (id: string) => api.get<{ salida: Conexion[]; entrada: Conexion[] }>(`/nodos/${id}/conexiones/`),
}

export const conexionService = {
  list: () => api.get<ApiListResponse<Conexion>>('/conexiones/'),
  get: (id: string) => api.get<Conexion>(`/conexiones/${id}/`),
  create: (data: Record<string, unknown>) => api.post<Conexion>('/conexiones/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Conexion>(`/conexiones/${id}/`, data),
  remove: (id: string) => api.delete(`/conexiones/${id}/`),
  toggleEstado: (id: string) => api.post(`/conexiones/${id}/estado/`),
}

export const rutaService = {
  calcular: (origen_id: string, destino_id: string) =>
    api.post<RutaResult>('/rutas/', { origen_id, destino_id }),
}
