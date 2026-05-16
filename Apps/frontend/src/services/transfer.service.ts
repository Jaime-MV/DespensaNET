import api from './api';

export interface BranchStock {
  id_sucursal: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
}

export interface ProductWithStock {
  id_producto: number;
  codigo: string;
  nombre: string;
  categoria: string;
  sucursales: BranchStock[];
}

export const transferService = {
  getAll: async () => {
    const response = await api.get('/transfers');
    return response.data;
  },

  create: async (data: {
    id_sucursal_origen: number;
    id_sucursal_destino: number;
    items: { id_producto: number; cantidad: number }[];
    observaciones?: string;
  }) => {
    const response = await api.post('/transfers', data);
    return response.data;
  },

  updateStatus: async (id: number, estado: 'autorizado' | 'rechazado') => {
    const response = await api.put(`/transfers/${id}/status`, { estado });
    return response.data;
  },

  searchProducts: async (query: string): Promise<ProductWithStock[]> => {
    const response = await api.get('/transfers/products/search', { params: { q: query } });
    return response.data;
  },

  getBranches: async () => {
    const response = await api.get('/users/branches');
    return response.data;
  },
};
