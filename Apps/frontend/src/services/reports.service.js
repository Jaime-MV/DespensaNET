import api from './api';

export const reportsService = {
  getSucursales: () => api.get('/reports/sucursales').then(r => r.data),
  getSalesReport: (params) => api.get('/reports/sales', { params }).then(r => r.data),
};
