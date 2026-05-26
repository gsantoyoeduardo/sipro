import api from './axios'
import type { Stats } from './empresa'

export const dashboardService = {
  getKpis: () => api.get<Stats>('/portal/api/estadisticas/'),
}
