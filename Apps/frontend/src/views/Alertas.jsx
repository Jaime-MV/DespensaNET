import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function Alertas() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [resStock, resExpiry] = await Promise.all([
        inventoryService.getAlerts(),
        inventoryService.getExpiryAlerts()
      ]);
      setAlerts(resStock.alerts || []);
      setExpiryAlerts(resExpiry.alerts || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las alertas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolveStock = async (id) => {
    try {
      await inventoryService.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
      alert('Error al resolver la alerta de stock');
    }
  };

  const handleResolveExpiry = async (id) => {
    try {
      await inventoryService.resolveExpiryAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
      alert('Error al resolver la alerta de caducidad');
    }
  };

  const allAlerts = [
    ...alerts.map(a => ({ ...a, category: 'stock' })),
    ...expiryAlerts.map(a => ({ ...a, category: 'expiry' }))
  ].sort((a, b) => {
    if (a.resuelta !== b.resuelta) return a.resuelta ? 1 : -1;
    return new Date(b.fecha_generada) - new Date(a.fecha_generada);
  });

  if (loading && allAlerts.length === 0) {
    return <div className="p-6 text-center text-gray-500">Cargando alertas...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-red-500" /> Alertas de Inventario
          </h1>
          <p className="text-sm text-gray-500">Monitoreo de niveles críticos, sobreabastecimiento y caducidad.</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle /> {error}
        </div>
      )}

      {allAlerts.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <CheckCircle className="mx-auto text-4xl text-green-500 mb-3" size={48} />
          <h3 className="text-lg font-medium text-gray-900">Todo en orden</h3>
          <p className="text-gray-500 text-sm">No hay alertas de inventario en este momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allAlerts.map((alert) => (
            <div
              key={`${alert.category}-${alert.category === 'stock' ? alert.id_alerta : alert.id_alerta_caducidad}`}
              className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${
                alert.resuelta ? 'border-gray-300 opacity-70' : 
                alert.category === 'stock' && alert.tipo === 'stock_minimo' ? 'border-red-500' : 
                alert.category === 'expiry' && alert.estado === 'vencido' ? 'border-red-500' :
                'border-yellow-500'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  alert.resuelta ? 'bg-gray-100 text-gray-600' :
                  (alert.category === 'stock' && alert.tipo === 'stock_minimo') || (alert.category === 'expiry' && alert.estado === 'vencido') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.category === 'stock' ? (
                     alert.tipo === 'stock_minimo' ? '⚠️ Stock Mínimo' : '📦 Sobreabastecimiento'
                  ) : (
                     alert.estado === 'vencido' ? '💀 Producto Vencido' : '⏳ Por Vencer'
                  )}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={14} /> {new Date(alert.fecha_generada).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-800 mb-1">{alert.producto_nombre}</h3>
              <p className="text-xs text-gray-500 mb-4">Código: {alert.producto_codigo} | Sucursal: {alert.sucursal_nombre}</p>
              
              {alert.category === 'stock' ? (
                <div className="flex items-center gap-4 text-sm mb-4 bg-gray-50 p-2 rounded">
                  <div>
                    <span className="block text-xs text-gray-500">Cantidad actual</span>
                    <span className="font-medium text-gray-900">{alert.cantidad_al_momento}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Umbral (Ref.)</span>
                    <span className="font-medium text-gray-900">{alert.umbral_referencia}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-sm mb-4 bg-gray-50 p-2 rounded">
                  <div>
                    <span className="block text-xs text-gray-500">Vencimiento</span>
                    <span className="font-medium text-gray-900">{new Date(alert.fecha_referencia).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Días restantes</span>
                    <span className="font-medium text-gray-900">{alert.dias_restantes}</span>
                  </div>
                </div>
              )}

              {!alert.resuelta ? (
                <button
                  onClick={() => alert.category === 'stock' ? handleResolveStock(alert.id_alerta) : handleResolveExpiry(alert.id_alerta_caducidad)}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-sm font-medium transition-colors"
                >
                  Marcar como {alert.category === 'expiry' ? 'Retirado' : 'Resuelta'}
                </button>
              ) : (
                <div className="w-full py-2 bg-gray-50 text-gray-500 text-center rounded text-sm font-medium flex justify-center items-center gap-1">
                  <CheckCircle size={16} /> {alert.category === 'expiry' ? 'Retirado' : 'Resuelta'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
