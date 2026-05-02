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
