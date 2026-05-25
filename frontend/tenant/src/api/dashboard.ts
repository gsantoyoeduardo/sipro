/**
 * Servicios de API para el Dashboard.
 * Proporciona endpoints para obtener indicadores clave
 * (KPIs) del sistema.
 */
import api from './axios'
import type { DashboardKPI } from '../types'

/** Servicio de obtenci\u00f3n de KPIs para el dashboard principal */
export const dashboardService = {
  getKpis: () => api.get<DashboardKPI>('/tenant/api/dashboard/kpis/'),
}
