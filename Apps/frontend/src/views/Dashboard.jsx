/**
 * src/views/Dashboard.jsx
 * Dashboard Global — Vista exclusiva del Propietario.
 *
 * Estructura:
 *  1. KPIs  — 5 tarjetas superiores
 *  2. Gráficos — líneas (7 días) · dona (sucursales hoy) · barras (top5)
 *  3. Tablas — top5 rotación · últimas 10 alertas
 *
 * Librerías requeridas: recharts
 *   npm install recharts   (dentro de apps/frontend)
 */
import { useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, Legend,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';

import { useAuth }        from '../hooks/useAuth';
import { useDashboard }   from '../hooks/useDashboard';
import KpiCard            from '../components/dashboard/KpiCard';
import ChartWrapper       from '../components/dashboard/ChartWrapper';
import AccessDenied       from '../components/dashboard/AccessDenied';

// ── Paleta de colores ──────────────────────────────────────────────────────
const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

// ── Formatters ─────────────────────────────────────────────────────────────
const currency = (v) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v ?? 0);

const shortDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// ── Skeleton loader ─────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
  );
}

// ── Sección de KPIs ─────────────────────────────────────────────────────────
function KpiSection({ kpis }) {
  const { ventas_hoy, alertas_stock_activas, traslados_pendientes, ventas_con_oferta_hoy } = kpis;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        title="Ventas Hoy"
        value={currency(ventas_hoy.total)}
        subtitle={`${ventas_hoy.transacciones} transacciones`}
        icon="💰"
        accent="bg-indigo-100 text-indigo-600"
      />
      <KpiCard
        title="Alertas de Stock"
        value={alertas_stock_activas}
        subtitle="alertas activas sin resolver"
        icon="⚠️"
        accent="bg-amber-100 text-amber-600"
      />
      <KpiCard
        title="Traslados Pendientes"
        value={traslados_pendientes}
        subtitle="esperando autorización"
        icon="🔄"
        accent="bg-blue-100 text-blue-600"
      />
      <KpiCard
        title="Ventas con Oferta Hoy"
        value={ventas_con_oferta_hoy}
        subtitle="transacciones con descuento"
        icon="🏷️"
        accent="bg-emerald-100 text-emerald-600"
      />
    </section>
  );
}

// ── Sección de Gráficos ─────────────────────────────────────────────────────
function ChartsSection({ graficos }) {
  const { ventas_7_dias, ingresos_por_sucursal_hoy, top5_productos } = graficos;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Líneas: ventas 7 días */}
      <ChartWrapper title="Ventas — Últimos 7 días" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ventas_7_dias} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="fecha"
              tickFormatter={shortDate}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip
              formatter={(v) => [currency(v), 'Ventas']}
              labelFormatter={(l) => `Fecha: ${shortDate(l)}`}
            />
            <Line
              type="monotone"
              dataKey="total_ventas"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366f1' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Dona: ingresos por sucursal hoy */}
      <ChartWrapper title="Ingresos por Sucursal Hoy">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={ingresos_por_sucursal_hoy}
              dataKey="ingresos"
              nameKey="sucursal"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {ingresos_por_sucursal_hoy.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => currency(v)} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Barras: top 5 productos */}
      <ChartWrapper title="Top 5 Productos — Últimos 7 días" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={top5_productos}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis
              dataKey="producto"
              type="category"
              width={130}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip formatter={(v) => [`${v} uds.`, 'Vendido']} />
            <Bar dataKey="unidades_vendidas" radius={[0, 6, 6, 0]}>
              {top5_productos.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </section>
  );
}

// ── Sección de Tablas ─────────────────────────────────────────────────────
function TablesSection({ tablas }) {
  const { top5_rotacion_inventario, ultimas_10_alertas } = tablas;

  const badgeAlerta = (tipo) =>
    tipo === 'stock_minimo'
      ? 'bg-red-100 text-red-600'
      : 'bg-amber-100 text-amber-600';

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Tabla: rotación de inventario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Top 5 Sucursales · Mayor Rotación (7 días)
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-50">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Sucursal</th>
              <th className="pb-2 font-medium text-right">Unidades</th>
              <th className="pb-2 font-medium text-right">Índice</th>
            </tr>
          </thead>
          <tbody>
            {top5_rotacion_inventario.map((row, i) => (
              <tr key={row.id_sucursal} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="py-3 text-gray-400 font-mono">{i + 1}</td>
                <td className="py-3 font-medium text-gray-800">{row.sucursal}</td>
                <td className="py-3 text-right text-gray-600">{row.unidades_vendidas.toLocaleString()}</td>
                <td className="py-3 text-right">
                  <span className="font-bold text-indigo-600">{row.indice_rotacion.toFixed(2)}×</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabla: últimas alertas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Últimas Alertas Generadas
        </h3>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-72">
          {ultimas_10_alertas.map((alerta) => (
            <div
              key={alerta.id_alerta}
              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{alerta.producto}</p>
                <p className="text-xs text-gray-400">{alerta.sucursal}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Stock: <span className="font-medium text-gray-600">{alerta.cantidad_al_momento}</span>
                  {' / '}Umbral: <span className="font-medium text-gray-600">{alerta.umbral_referencia}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeAlerta(alerta.tipo)}`}>
                  {alerta.tipo === 'stock_minimo' ? 'Stock Bajo' : 'Sobreabast.'}
                </span>
                {alerta.resuelta && (
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Resuelta</span>
                )}
                <span className="text-[10px] text-gray-300">
                  {new Date(alerta.fecha_generada).toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Vista principal ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout }            = useAuth();
  const { data, loading, error, refresh } = useDashboard();

  useEffect(() => {
    document.title = 'Dashboard Global · DespensaNET';
  }, []);

  // ── Guard de rol ──────────────────────────────────────────────────────────
  if (user?.role !== 'Propietario') return <AccessDenied />;

  const nombre = user?.nombre ?? user?.email ?? 'Propietario';

  return (
    <div className="p-6 min-h-screen bg-gray-50 w-full flex flex-col gap-6">

      {/* Header */}
      <header className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Dashboard Global
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            👋 Hola, {nombre.split(' ')[0]} ·{' '}
            <span className="text-indigo-600 font-medium">Propietario</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón refrescar */}
          <button
            onClick={refresh}
            disabled={loading}
            title="Actualizar datos"
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}>
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={logout}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors font-medium text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Estado: error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 flex items-center justify-between text-sm">
          <span>⚠️ {error}</span>
          <button onClick={refresh} className="underline font-medium hover:text-red-900">Reintentar</button>
        </div>
      )}

      {/* Estado: cargando */}
      {loading && !data && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Skeleton className="h-64 xl:col-span-2" />
            <Skeleton className="h-64" />
            <Skeleton className="h-56 xl:col-span-3" />
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </section>
        </>
      )}

      {/* Contenido */}
      {data && (
        <>
          <KpiSection    kpis={data.kpis} />
          <ChartsSection graficos={data.graficos} />
          <TablesSection tablas={data.tablas} />
        </>
      )}

      {/* Footer timestamp */}
      {data && !loading && (
        <p className="text-center text-xs text-gray-300 pb-2">
          Última actualización: {new Date().toLocaleTimeString('es-MX')}
        </p>
      )}
    </div>
  );
}
