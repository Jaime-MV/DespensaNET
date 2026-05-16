import { useState, useCallback } from 'react';
import { transferService, ProductWithStock } from '../../../services/transfer.service';

export interface TransferItem {
  id_producto: number;
  cantidad: number;
}

export interface CreateTransferPayload {
  id_sucursal_origen: number;
  id_sucursal_destino: number;
  items: TransferItem[];
  observaciones?: string;
}

export interface Traslado {
  id_traslado: number;
  id_sucursal_origen: number;
  id_sucursal_destino: number;
  id_usuario_solicitante: number;
  estado: 'pendiente' | 'autorizado' | 'rechazado' | 'completado';
  fecha_solicitud: string;
  fecha_autorizacion: string | null;
  observaciones: string | null;
  origen_nombre: string;
  destino_nombre: string;
  solicitante_nombre: string;
  items: {
    id_producto: number;
    producto_nombre: string;
    producto_codigo: string;
    cantidad: number;
  }[];
}

export const useTraslados = () => {
  const [traslados, setTraslados] = useState<Traslado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product search state
  const [searchResults, setSearchResults] = useState<ProductWithStock[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchTraslados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transferService.getAll();
      setTraslados(data);
    } catch (err: any) {
      console.error('Error fetching traslados', err);
      setError(err.response?.data?.message || 'Error al cargar traslados');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTraslado = async (payload: CreateTransferPayload) => {
    try {
      setLoading(true);
      setError(null);
      const result = await transferService.create(payload);
      await fetchTraslados();
      return result;
    } catch (err: any) {
      console.error('Error creating transfer', err);
      setError(err.response?.data?.message || 'Error al crear traslado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEstadoTraslado = async (id: number, estado: 'autorizado' | 'rechazado') => {
    try {
      setLoading(true);
      setError(null);
      await transferService.updateStatus(id, estado);
      await fetchTraslados();
      return true;
    } catch (err: any) {
      console.error('Error updating status', err);
      setError(err.response?.data?.message || 'Error al actualizar el estado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const data = await transferService.searchProducts(query);
      setSearchResults(data);
    } catch (err: any) {
      console.error('Error searching products', err);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => setSearchResults([]);

  return {
    traslados,
    loading,
    error,
    fetchTraslados,
    createTraslado,
    updateEstadoTraslado,
    searchProducts,
    searchResults,
    searching,
    clearSearch,
  };
};
