/**
 * src/services/dashboard.service.js
 * Consumo del endpoint GET /dashboard (propietario).
 */
import api from './api';

export const dashboardService = {
  /**
   * GET /api/dashboard
   * Retorna el JSON consolidado con kpis, graficos y tablas.
   * @returns {Promise<DashboardData>}
   */
  getGlobalDashboard: () =>
    api.get('/dashboard').then((r) => r.data),
};
