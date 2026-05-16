import { useState, useCallback } from 'react';
import { usersService } from '../services/users.service';

/**
 * useUsers
 * Centralizes all state and side-effects for the Users CRUD view.
 */
export function useUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (payload) => {
    const result = await usersService.create(payload);
    await fetchUsers();
    return result;
  };

  const updateUser = async (id, payload) => {
    const result = await usersService.update(id, payload);
    await fetchUsers();
    return result;
  };

  const deactivateUser = async (id) => {
    const result = await usersService.remove(id);
    await fetchUsers();
    return result;
  };

  return { users, loading, error, fetchUsers, createUser, updateUser, deactivateUser };
}
