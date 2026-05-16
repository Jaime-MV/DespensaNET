/**
 * src/views/Dashboard.jsx
 * Dashboard Global — Vista exclusiva del Propietario.
 *
 * Diseño corporativo con tipografía formal, colores sobrios
 * y estructura limpia de KPIs, gráficos y tablas.
 *
 * Librerías requeridas: recharts
 */
import { useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip, Legend,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';

import { useAuth }      from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import KpiCard          from '../components/dashboard/KpiCard';
import ChartWrapper     from '../components/dashboard/ChartWrapper';
import AccessDenied     from '../components/dashboard/AccessDenied';

// ── Paleta corporativa ──────────────────────────────────────────────────
const PALETTE = ['#4338ca', '#0891b2', '#0d9488', '#7c3aed', '#2563eb', '#6366f1'];

// ── Formatters ──────────────────────────────────────────────────────────
const currency = (v) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);

const shortDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

// ── Skeleton loader ─────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

// ── Sección de KPIs ─────────────────────────────────────────────────────
function KpiSection({ kpis }) {
  const { ventas_hoy, alertas_stock_activas, traslados_pendientes, ventas_con_oferta_hoy } = kpis;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <KpiCard
        title="Ventas del Día"
        value={currency(ventas_hoy.total)}
        subtitle={`${ventas_hoy.transacciones} transacciones`}
        icon="💰"
        accent="bg-indigo-50 text-indigo-700"
      />
      <KpiCard
        title="Alertas de Stock"
        value={alertas_stock_activas}
        subtitle="pendientes de resolución"
        icon="⚠️"
        accent="bg-amber-50 text-amber-700"
      />
      <KpiCard
        title="Traslados Pendientes"
        value={traslados_pendientes}
        subtitle="esperando autorización"
        icon="🔄"
        accent="bg-cyan-50 text-cyan-700"
      />
      <KpiCard
        title="Ventas con Oferta"
        value={ventas_con_oferta_hoy}
        subtitle="con descuento aplicado hoy"
        icon="🏷️"
        accent="bg-emerald-50 text-emerald-700"
      />
    </section>
  );
}

// ── Sección de Gráficos ─────────────────────────────────────────────────
function ChartsSection({ graficos }) {
  const { ventas_7_dias, ingresos_por_sucursal_hoy, top5_productos } = graficos;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Líneas: ventas 7 días */}
      <ChartWrapper title="Ventas — Últimos 7 días" className="xl:col-span-2">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={ventas_7_dias} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="fecha"
              tickFormatter={shortDate}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip
              formatter={(v) => [currency(v), 'Ventas']}
              labelFormatter={(l) => `Fecha: ${shortDate(l)}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <Line
              type="monotone"
              dataKey="total_ventas"
              stroke="#4338ca"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#4338ca', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#4338ca', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Dona: ingresos por sucursal hoy */}
      <ChartWrapper title="Ingresos por Sucursal — Hoy">
        <ResponsiveContainer width="100%" height={260}>
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
              strokeWidth={2}
              stroke="#fff"
            >
              {ingresos_por_sucursal_hoy.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => currency(v)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(v) => <span className="text-xs text-slate-600">{v}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Barras: top 5 productos */}
      <ChartWrapper title="Top 5 Productos Vendidos — 7 Días" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            data={top5_productos}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis
              dataKey="producto"
              type="category"
              width={140}
              tick={{ fontSize: 12, fill: '#334155', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`${v} uds.`, 'Vendido']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            />
            <Bar dataKey="unidades_vendidas" radius={[0, 6, 6, 0]} barSize={22}>
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

// ── Sección de Tablas ───────────────────────────────────────────────────
function TablesSection({ tablas }) {
  const { top5_rotacion_inventario, ultimas_10_alertas } = tablas;

  const badgeAlerta = (tipo) =>
    tipo === 'stock_minimo'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : 'bg-amber-50 text-amber-700 border border-amber-200';

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Tabla: rotación de inventario */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
            Top 5 Sucursales · Mayor Rotación (7 Días)
          </h3>
        </div>
        <div className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold w-8">#</th>
                <th className="pb-3 font-semibold">Sucursal</th>
                <th className="pb-3 font-semibold text-right">Unidades</th>
                <th className="pb-3 font-semibold text-right">Índice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {top5_rotacion_inventario.map((row, i) => (
                <tr key={row.id_sucursal} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 text-slate-400 font-mono text-xs">{i + 1}</td>
                  <td className="py-3.5 font-medium text-slate-800">{row.sucursal}</td>
                  <td className="py-3.5 text-right text-slate-600 tabular-nums">{row.unidades_vendidas.toLocaleString()}</td>
                  <td className="py-3.5 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold tabular-nums">
                      {row.indice_rotacion.toFixed(2)}×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla: últimas alertas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
            Últimas Alertas Generadas
          </h3>
        </div>
        <div className="p-4 flex flex-col gap-2.5 overflow-y-auto max-h-80">
          {ultimas_10_alertas.map((alerta) => (
            <div
              key={alerta.id_alerta}
              className="flex items-start justify-between gap-3 p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{alerta.producto}</p>
                <p className="text-xs text-slate-400 mt-0.5">{alerta.sucursal}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Stock: <span className="font-medium text-slate-600 tabular-nums">{alerta.cantidad_al_momento}</span>
                  {' · '}Umbral: <span className="font-medium text-slate-600 tabular-nums">{alerta.umbral_referencia}</span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeAlerta(alerta.tipo)}`}>
                  {alerta.tipo === 'stock_minimo' ? 'Stock Bajo' : 'Sobreabast.'}
                </span>
                {alerta.resuelta && (
                  <span className="text-[10px] text-emerald-600 font-semibold">✓ Resuelta</span>
                )}
                <span className="text-[10px] text-slate-300 tabular-nums">
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

// ── Vista principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }                          = useAuth();
  const { data, loading, error, refresh } = useDashboard();

  useEffect(() => {
    document.title = 'Dashboard Global · DespensaNET';
  }, []);

  // ── Guard de rol ──
  if (user?.role !== 'Propietario') return <AccessDenied />;

  const nombre = user?.nombre ?? user?.email ?? 'Propietario';
  const today  = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-6 lg:p-8 min-h-screen w-full flex flex-col gap-6">

      {/* ── Page Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Global
          </h1>
          <p className="text-sm text-slate-400 mt-1 capitalize">{today}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            title="Actualizar datos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-700 transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
            Actualizar
          </button>
        </div>
      </header>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-5 py-3.5 flex items-center justify-between text-sm">
          <span>⚠️ {error}</span>
          <button onClick={refresh} className="underline font-medium hover:text-red-900">Reintentar</button>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && !data && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Skeleton className="h-72 xl:col-span-2" />
            <Skeleton className="h-72" />
            <Skeleton className="h-56 xl:col-span-3" />
          </section>
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </section>
        </>
      )}

      {/* ── Content ── */}
      {data && (
        <>
          <KpiSection    kpis={data.kpis} />
          <ChartsSection graficos={data.graficos} />
          <TablesSection tablas={data.tablas} />
        </>
      )}

      {/* ── Footer timestamp ── */}
      {data && !loading && (
        <p className="text-center text-xs text-slate-300 pb-2 tabular-nums">
          Última actualización: {new Date().toLocaleTimeString('es-MX')}
        </p>
      )}
    </div>
  );
}
