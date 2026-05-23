import api from './axios'
import type { Stats } from './empresa'

/** Servicio de consulta de indicadores del dashboard */
export const dashboardService = {
  /**
   * Obtiene los KPIs globales del sistema (total empresas,
   * total usuarios, empresas activas e inactivas).
   * Endpoint: GET /portal/api/registro/stats/
   */
  getKpis: () => api.get<Stats>('/portal/api/registro/stats/'),
}
