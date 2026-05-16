/**
 * src/services/api.js
 * Central Axios instance for all NestJS API calls.
 *
 * Features:
 *  - Base URL points to the NestJS backend (/api)
 *  - Request interceptor: injects JWT Bearer token from sessionStorage
 *  - Response interceptor: on 401 clears session and redirects to /login
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const SESSION_KEY = 'despensanet_session';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor: attach JWT ── */
api.interceptors.request.use((config) => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
  } catch {
    // malformed session — ignore
  }
  return config;
});

/* ── Response interceptor: handle 401 ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(SESSION_KEY);
      // Hard redirect so the router resets
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

/* ── Auth endpoints ── */
export const authService = {
  /**
   * POST /api/auth/login
   * @returns { accessToken, user }
   */
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  /**
   * GET /api/auth/me  (requires valid JWT)
   * @returns user profile
   */
  me: () => api.get('/auth/me').then((r) => r.data),
};

/* ── Sales / POS endpoints ── */
export const salesService = {
  /** Search product by barcode/serial */
  searchProduct: (code) =>
    api.get('/sales/product', { params: { code } }).then((r) => r.data),

  /** Create (finalize) a sale */
  createSale: (payload) =>
    api.post('/sales', payload).then((r) => r.data),

  /** Get today's sales history */
  getTodaySales: () =>
    api.get('/sales/today').then((r) => r.data),

  /** Get active offers (read-only) */
  getActiveOffers: () =>
    api.get('/sales/offers').then((r) => r.data),
};

/* ── Inventory endpoints ── */
export const inventoryService = {
  getProducts: () => api.get('/inventory').then((r) => r.data),
  createProduct: (data) => api.post('/inventory', data).then((r) => r.data),
  updateProduct: (id, data) => api.put(`/inventory/${id}`, data).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/inventory/${id}`).then((r) => r.data),
  updateStock: (id, data) => api.put(`/inventory/${id}/stock`, data).then((r) => r.data),
  
  // Offers
  getOffers: (tipo) => api.get(`/inventory/offers${tipo ? `?tipo=${tipo}` : ''}`).then((r) => r.data),
  createOffer: (data) => api.post('/inventory/offers', data).then((r) => r.data),
  updateOffer: (id, data) => api.put(`/inventory/offers/${id}`, data).then((r) => r.data),
  deleteOffer: (id) => api.delete(`/inventory/offers/${id}`).then((r) => r.data),
};
