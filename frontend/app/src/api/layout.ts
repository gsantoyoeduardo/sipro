/**
 * Servicios de API para la gesti\u00f3n del layout del almac\u00e9n.
 * Proporciona 8 sub-servicios: Zona, Pasillo, Estante, Nivel, Ubicaci\u00f3n,
 * Nodo, Conexi\u00f3n y Ruta. Cada uno expone endpoints CRUD y operaciones
 * espec\u00edficas como toggle de estado y obtenci\u00f3n de sub-recursos.
 */
import api from './axios'
import type { Zona, Pasillo, Estante, Nivel, Ubicacion, Nodo, Conexion, RutaResult, ApiListResponse, PasilloSummary, EstanteSummary } from '../types'

/** Servicio CRUD para Zonas dentro de un almac\u00e9n */
export const zonaService = {
  list: (idalmacen?: string) => api.get<ApiListResponse<Zona>>('/tenant/api/zonas/', { params: idalmacen ? { idalmacen } : {} }),
  get: (id: string) => api.get<Zona>(/tenant/api/zonas//),
  create: (data: Record<string, unknown>) => api.post<Zona>('/tenant/api/zonas/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Zona>(/tenant/api/zonas//, data),
  remove: (id: string) => api.delete(/tenant/api/zonas//),
  toggleEstado: (id: string) => api.post(/tenant/api/zonas//estado/),
  getPasillos: (id: string) => api.get<PasilloSummary[]>(/tenant/api/zonas//pasillos/),
  createPasillo: (id: string, data: Record<string, unknown>) => api.post<Pasillo>(/tenant/api/zonas//pasillos/, data),
}

/** Servicio CRUD para Pasillos dentro de una zona */
export const pasilloService = {
  list: (idzona?: string) => api.get<ApiListResponse<Pasillo>>('/tenant/api/pasillos/', { params: idzona ? { idzona } : {} }),
  get: (id: string) => api.get<Pasillo>(/tenant/api/pasillos//),
  create: (data: Record<string, unknown>) => api.post<Pasillo>('/tenant/api/pasillos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Pasillo>(/tenant/api/pasillos//, data),
  remove: (id: string) => api.delete(/tenant/api/pasillos//),
  toggleEstado: (id: string) => api.post(/tenant/api/pasillos//estado/),
  getEstantes: (id: string) => api.get<EstanteSummary[]>(/tenant/api/pasillos//estantes/),
  createEstante: (id: string, data: Record<string, unknown>) => api.post<Estante>(/tenant/api/pasillos//estantes/, data),
}

/** Servicio CRUD para Estantes dentro de un pasillo */
export const estanteService = {
  list: (idpasillo?: string) => api.get<ApiListResponse<Estante>>('/tenant/api/estantes/', { params: idpasillo ? { idpasillo } : {} }),
  get: (id: string) => api.get<Estante>(/tenant/api/estantes//),
  create: (data: Record<string, unknown>) => api.post<Estante>('/tenant/api/estantes/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Estante>(/tenant/api/estantes//, data),
  remove: (id: string) => api.delete(/tenant/api/estantes//),
  toggleEstado: (id: string) => api.post(/tenant/api/estantes//estado/),
  getNiveles: (id: string) => api.get<Nivel[]>(/tenant/api/estantes//niveles/),
  createNivel: (id: string, data: Record<string, unknown>) => api.post<Nivel>(/tenant/api/estantes//niveles/, data),
}

/** Servicio CRUD para Niveles dentro de un estante */
export const nivelService = {
  list: (idestante?: string) => api.get<ApiListResponse<Nivel>>('/tenant/api/niveles/', { params: idestante ? { idestante } : {} }),
  get: (id: string) => api.get<Nivel>(/tenant/api/niveles//),
  create: (data: Record<string, unknown>) => api.post<Nivel>('/tenant/api/niveles/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Nivel>(/tenant/api/niveles//, data),
  remove: (id: string) => api.delete(/tenant/api/niveles//),
  toggleEstado: (id: string) => api.post(/tenant/api/niveles//estado/),
  getUbicaciones: (id: string) => api.get<Ubicacion[]>(/tenant/api/niveles//ubicaciones/),
  createUbicacion: (id: string, data: Partial<Ubicacion>) => api.post<Ubicacion>(/tenant/api/niveles//ubicaciones/, data),
}

/** Servicio CRUD para Ubicaciones dentro de un nivel */
export const ubicacionService = {
  list: (idnivel?: string) => api.get<ApiListResponse<Ubicacion>>('/tenant/api/ubicaciones/', { params: idnivel ? { idnivel } : {} }),
  get: (id: string) => api.get<Ubicacion>(/tenant/api/ubicaciones//),
  create: (data: Record<string, unknown>) => api.post<Ubicacion>('/tenant/api/ubicaciones/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Ubicacion>(/tenant/api/ubicaciones//, data),
  remove: (id: string) => api.delete(/tenant/api/ubicaciones//),
  toggleEstado: (id: string) => api.post(/tenant/api/ubicaciones//estado/),
  cambiarEstado: (id: string, estado_ubicacion: string) => api.patch(/tenant/api/ubicaciones//estado-ubicacion/, { estado_ubicacion }),
}

/** Servicio CRUD para Nodos del grafo del layout */
export const nodoService = {
  list: (idalmacen?: string) => api.get<ApiListResponse<Nodo>>('/tenant/api/nodos/', { params: idalmacen ? { idalmacen } : {} }),
  get: (id: string) => api.get<Nodo>(/tenant/api/nodos//),
  create: (data: Record<string, unknown>) => api.post<Nodo>('/tenant/api/nodos/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Nodo>(/tenant/api/nodos//, data),
  remove: (id: string) => api.delete(/tenant/api/nodos//),
  toggleEstado: (id: string) => api.post(/tenant/api/nodos//estado/),
  getConexiones: (id: string) => api.get<{ salida: Conexion[]; entrada: Conexion[] }>(/tenant/api/nodos//conexiones/),
}

/** Servicio CRUD para Conexiones entre nodos */
export const conexionService = {
  list: () => api.get<ApiListResponse<Conexion>>('/tenant/api/conexiones/'),
  get: (id: string) => api.get<Conexion>(/tenant/api/conexiones//),
  create: (data: Record<string, unknown>) => api.post<Conexion>('/tenant/api/conexiones/', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Conexion>(/tenant/api/conexiones//, data),
  remove: (id: string) => api.delete(/tenant/api/conexiones//),
  toggleEstado: (id: string) => api.post(/tenant/api/conexiones//estado/),
}

/** Servicio para c\u00e1lculo de rutas entre dos nodos */
export const rutaService = {
  calcular: (origen_id: string, destino_id: string) =>
    api.post<RutaResult>('/tenant/api/rutas/', { origen_id, destino_id }),
}
