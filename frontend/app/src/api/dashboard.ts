import api from './axios'
import type { DashboardKPI } from '../types'

export const dashboardService = {
  getKpis: () => api.get<DashboardKPI>('/tenant/api/dashboard/kpis/'),
}
