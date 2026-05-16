/**
 * src/hooks/useDashboard.js
 * Custom hook para cargar los datos del dashboard global.
 * Maneja estados: loading, error y data.
 */
import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';

export function useDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getGlobalDashboard();
      setData(result);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? 'Error al cargar el dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
