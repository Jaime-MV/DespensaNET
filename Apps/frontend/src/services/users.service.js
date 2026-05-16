import api from './api';

export const usersService = {
  /** GET /users — list all (scoped by role server-side) */
  getAll: () =>
    api.get('/users').then((r) => r.data),

  /** GET /users/:id */
  getOne: (id) =>
    api.get(`/users/${id}`).then((r) => r.data),

  /** POST /users */
  create: (payload) =>
    api.post('/users', payload).then((r) => r.data),

  /** PUT /users/:id */
  update: (id, payload) =>
    api.put(`/users/${id}`, payload).then((r) => r.data),

  /** DELETE /users/:id — soft delete (deactivate) */
  remove: (id) =>
    api.delete(`/users/${id}`).then((r) => r.data),

  /** GET /branches — fetch sucursales for the role selector */
  getBranches: () =>
    api.get('/users/branches').then((r) => r.data),

  /** GET /roles — fetch available roles */
  getRoles: () =>
    api.get('/roles').then((r) => r.data),
};
