import { useEffect, useState, useMemo } from 'react';
import { useTraslados, Traslado } from './hooks/useTraslados';
import NuevoTrasladoModal from './components/NuevoTrasladoModal';
import { useAuth } from '../../hooks/useAuth';

/* ─── Inline SVG icon helpers ─── */
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const TruckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0m6-6v6a1 1 0 01-1 1h-1m-6-1a2 2 0 10-4 0m4 0H9" /></svg>
);
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

/* ─── Status badge map ─── */
const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pendiente:  { label: 'Pendiente',  bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  autorizado: { label: 'Autorizado', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  completado: { label: 'Completado', bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-400' },
  rechazado:  { label: 'Rechazado',  bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-400' },
};

export default function TrasladosView() {
  const { user } = useAuth() as any;
  const {
    traslados, loading, error,
    fetchTraslados, createTraslado, updateEstadoTraslado,
    searchProducts, searchResults, searching, clearSearch,
  } = useTraslados();

  const [isModalOpen, setIsModalOpen] = useState(false);

  /* Filters */
  const [searchId, setSearchId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');

  useEffect(() => { fetchTraslados(); }, [fetchTraslados]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year  = now.getFullYear();
    return {
      pendientes:  traslados.filter(t => t.estado === 'pendiente').length,
      enTransito:  traslados.filter(t => t.estado === 'autorizado').length,
      completados: traslados.filter(t => {
        if (t.estado !== 'completado') return false;
        const d = new Date(t.fecha_solicitud);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length,
      rechazados:  traslados.filter(t => t.estado === 'rechazado').length,
    };
  }, [traslados]);

  /* ─── Filtered list ─── */
  const filtered = useMemo(() => {
    return traslados.filter((t: Traslado) => {
      if (searchId) {
        const idStr = `TR-${String(t.id_traslado).padStart(5, '0')}`.toLowerCase();
        if (!idStr.includes(searchId.toLowerCase()) && !String(t.id_traslado).includes(searchId)) return false;
      }
      if (estadoFilter !== 'todos' && t.estado !== estadoFilter) return false;
      if (dateFrom && new Date(t.fecha_solicitud) < new Date(dateFrom)) return false;
      if (dateTo   && new Date(t.fecha_solicitud) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [traslados, searchId, dateFrom, dateTo, estadoFilter]);

  /* ─── Action handlers ─── */
  const handleStatus = async (id: number, estado: 'autorizado' | 'rechazado') => {
    const verb = estado === 'autorizado' ? 'autorizar' : 'rechazar';
    if (!window.confirm(`¿Estás seguro de ${verb} este traslado?`)) return;
    try { await updateEstadoTraslado(id, estado); } catch { /* hook sets error */ }
  };

  const fmtId    = (id: number) => `TR-${String(id).padStart(5, '0')}`;
  const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const itemsQty = (t: Traslado) => t.items?.reduce((s, i) => s + i.cantidad, 0) ?? 0;

  /* ─── Render ─── */
  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Inventario · Workspace
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Traslados de Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operando como encargado · <span className="font-medium text-slate-700">{user?.sucursal ?? 'Sucursal'}</span>
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow hover:bg-slate-800 transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Nueva solicitud
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <XCircleIcon />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pendientes de tu autorización', value: stats.pendientes, icon: <ClockIcon />, color: 'text-amber-500', ring: 'bg-amber-50' },
          { label: 'Solicitudes en tránsito',       value: stats.enTransito,  icon: <TruckIcon />, color: 'text-blue-500',  ring: 'bg-blue-50' },
          { label: 'Completados este mes',           value: stats.completados, icon: <CheckCircleIcon />, color: 'text-emerald-500', ring: 'bg-emerald-50' },
          { label: 'Rechazados',                     value: stats.rechazados,  icon: <XCircleIcon />, color: 'text-red-500', ring: 'bg-red-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${s.ring} ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search by ID */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Buscar por ID</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                type="text"
                placeholder="TR-10241"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
              />
            </div>
          </div>
          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
          </div>
          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300" />
          </div>
          {/* Status filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300">
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="autorizado">Autorizado</option>
                <option value="completado">Completado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && traslados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <svg className="animate-spin h-8 w-8 mb-4 text-slate-900" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm">Cargando traslados…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/60">
                  {['ID', 'Origen', 'Destino', 'Solicitante', 'Fecha', 'Ítems', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                      <p className="text-sm text-slate-400">No se encontraron traslados.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t: Traslado) => {
                    const involucrado = user?.idSucursal === t.id_sucursal_origen || user?.idSucursal === t.id_sucursal_destino;
                    const sc = statusConfig[t.estado] ?? statusConfig.pendiente;

                    return (
                      <tr key={t.id_traslado} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-sm font-mono font-medium text-slate-800">{fmtId(t.id_traslado)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{t.origen_nombre}</td>
                        <td className="px-5 py-4 text-sm">
                          <span className="inline-flex items-center gap-1.5 text-slate-800 font-medium">
                            <span className="text-slate-400">›</span> {t.destino_nombre}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{t.solicitante_nombre}</td>
                        <td className="px-5 py-4 text-sm text-slate-500 tabular-nums">{fmtDate(t.fecha_solicitud)}</td>
                        <td className="px-5 py-4 text-sm text-slate-700 font-semibold">{itemsQty(t)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {t.estado === 'pendiente' && involucrado ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleStatus(t.id_traslado, 'autorizado')}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
                                <CheckCircleIcon /> Autorizar
                              </button>
                              <button onClick={() => handleStatus(t.id_traslado, 'rechazado')}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                                <XCircleIcon /> Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <NuevoTrasladoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={createTraslado}
        loading={loading}
        searchProducts={searchProducts}
        searchResults={searchResults}
        searching={searching}
        clearSearch={clearSearch}
      />
    </div>
  );
}
