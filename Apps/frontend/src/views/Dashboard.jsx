import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

/* ── Mock data (replace with API calls to NestJS) ── */
const KPI_DATA = [
  {
    icon: '💳', color: 'green',
    value: 'Q 18,430', label: 'Ventas del día',
    trend: '+12.4%', trendDir: 'up',
  },
  {
    icon: '📦', color: 'sky',
    value: '1,284', label: 'Productos en stock',
    trend: '-3 bajos', trendDir: 'warn',
  },
  {
    icon: '🔔', color: 'red',
    value: '3', label: 'Alertas activas',
    trend: '↑ 1 nueva', trendDir: 'down',
  },
  {
    icon: '📊', color: 'amber',
    value: 'Q 142k', label: 'Ventas del mes',
    trend: '+8.1%', trendDir: 'up',
  },
];

const WEEK_SALES = [
  { day: 'Lun', amount: 9200,  active: false },
  { day: 'Mar', amount: 13400, active: false },
  { day: 'Mié', amount: 11800, active: false },
  { day: 'Jue', amount: 15900, active: false },
  { day: 'Vie', amount: 19300, active: false },
  { day: 'Sáb', amount: 22100, active: false },
  { day: 'Dom', amount: 18430, active: true  },
];

const MAX_SALE = Math.max(...WEEK_SALES.map((d) => d.amount));

const ALERTS = [
  { id: 1, dot: 'red',   title: 'Stock crítico',   desc: 'Arroz Extra x 50lb — 2 unidades',     time: 'Hace 5 min' },
  { id: 2, dot: 'amber', title: 'Stock bajo',       desc: 'Aceite Palma 1L — 8 unidades',        time: 'Hace 1h' },
  { id: 3, dot: 'amber', title: 'Stock bajo',       desc: 'Azúcar estándar 5lb — 11 unidades',   time: 'Hace 3h' },
];

const RECENT_SALES = [
  { id: '#V-0421', product: 'Venta POS · 12 ítem', user: 'Encargado',  total: 'Q 284.50', status: 'Completada',  badge: 'success' },
  { id: '#V-0420', product: 'Venta POS · 5 ítem',  user: 'Empleado',   total: 'Q 98.00',  status: 'Completada',  badge: 'success' },
  { id: '#V-0419', product: 'Traslado Sucursal 2',  user: 'Encargado',  total: '—',        status: 'Pendiente',   badge: 'warning' },
  { id: '#V-0418', product: 'Venta POS · 8 ítem',  user: 'Empleado',   total: 'Q 176.25', status: 'Completada',  badge: 'success' },
  { id: '#V-0417', product: 'Ajuste inventario',    user: 'Propietario', total: '—',       status: 'En revisión', badge: 'info'    },
];

const TOP_PRODUCTS = [
  { name: 'Arroz Extra 50lb',    qty: 148 },
  { name: 'Aceite Palma 1L',     qty: 113 },
  { name: 'Frijol Rojo 1lb',     qty: 97  },
  { name: 'Azúcar Estándar 5lb', qty: 85  },
  { name: 'Leche Entera 1L',     qty: 64  },
];

const MAX_QTY = TOP_PRODUCTS[0].qty;

function getRoleGreeting(role) {
  const map = {
    Propietario: 'Propietario',
    Encargado:   'Encargado',
    Empleado:    'Empleado',
  };
  return map[role] ?? role;
}

function formatDate() {
  return new Intl.DateTimeFormat('es-GT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date());
}

export default function Dashboard() {
  const { user } = useAuth();
  const role   = user?.role   ?? 'Empleado';
  const nombre = user?.nombre ?? user?.email ?? 'Usuario';

  useEffect(() => {
    document.title = 'Dashboard · DespensaNET';
    const el = document.getElementById('page-title');
    if (el) el.textContent = 'Dashboard';
  }, []);

  return (
    <section className="dashboard" aria-labelledby="dashboard-heading">

      {/* ── Page header ── */}
      <header className="dashboard__header">
        <div>
          <h2 className="dashboard__greeting" id="dashboard-heading">
            👋 Hola, {nombre.split(' ')[0]}
            <span className="dashboard__greeting-role">{role}</span>
          </h2>
          <p className="dashboard__date">{formatDate()}</p>
        </div>

        <div className="dashboard__header-actions">
          <button className="btn btn--ghost">📤 Exportar</button>
          <button className="btn btn--primary">➕ Nueva Venta</button>
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid" role="list" aria-label="Indicadores clave">
        {KPI_DATA.map((kpi) => (
          <article
            key={kpi.label}
            className={`kpi-card kpi-card--${kpi.color}`}
            role="listitem"
          >
            <div className="kpi-card__top">
              <div className={`kpi-card__icon kpi-card__icon--${kpi.color}`}>
                {kpi.icon}
              </div>
              <span className={`kpi-card__trend kpi-card__trend--${kpi.trendDir}`}>
                {kpi.trend}
              </span>
            </div>
            <div>
              <p className="kpi-card__value">{kpi.value}</p>
              <p className="kpi-card__label">{kpi.label}</p>
            </div>
          </article>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="dashboard__content-grid">

        {/* Sales chart + recent sales table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>

          {/* Weekly sales bar chart */}
          <div className="panel">
            <div className="panel__header">
              <span className="panel__title">📊 Ventas de la semana</span>
              <button className="panel__action">Ver reporte →</button>
            </div>
            <div className="panel__body">
              <div className="mini-chart" role="img" aria-label="Gráfico de ventas semanal">
                {WEEK_SALES.map((d) => (
                  <div key={d.day} className="mini-chart__bar-wrap">
                    <div
                      className={`mini-chart__bar${d.active ? ' mini-chart__bar--active' : ''}`}
                      style={{ height: `${(d.amount / MAX_SALE) * 100}%` }}
                      title={`${d.day}: Q ${d.amount.toLocaleString()}`}
                    />
                    <span className="mini-chart__label">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="mini-chart__summary">
                <div className="mini-chart__stat">
                  <span className="mini-chart__stat-value">Q 110,130</span>
                  <span className="mini-chart__stat-label">Total semana</span>
                </div>
                <div className="mini-chart__stat" style={{ textAlign: 'right' }}>
                  <span className="mini-chart__stat-value">Q 15,733</span>
                  <span className="mini-chart__stat-label">Promedio diario</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent movements table */}
          <div className="panel">
            <div className="panel__header">
              <span className="panel__title">🕒 Movimientos recientes</span>
              <button className="panel__action">Ver todos →</button>
            </div>
            <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="sales-table" aria-label="Movimientos recientes">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descripción</th>
                    <th>Usuario</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_SALES.map((s) => (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{s.id}</td>
                      <td>{s.product}</td>
                      <td>{s.user}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.total}</td>
                      <td>
                        <span className={`badge badge--${s.badge}`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column — Alerts */}
        <div className="panel">
          <div className="panel__header">
            <span className="panel__title">🔔 Alertas activas</span>
            <button className="panel__action">Ver todas →</button>
          </div>
          <div className="panel__body">
            <div className="alerts-list" role="list" aria-label="Alertas de inventario">
              {ALERTS.map((a) => (
                <div key={a.id} className="alert-item" role="listitem" tabIndex={0}>
                  <div className={`alert-item__dot alert-item__dot--${a.dot}`} aria-hidden="true" />
                  <div className="alert-item__content">
                    <p className="alert-item__title">{a.title}</p>
                    <p className="alert-item__desc">{a.desc}</p>
                  </div>
                  <span className="alert-item__time">{a.time}</span>
                </div>
              ))}
            </div>

            {/* Quick stats below alerts */}
            <div style={{ marginTop: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                Resumen de stock
              </p>
              {[
                { label: 'Productos normales', count: '1,279', pct: 99, color: 'var(--color-success)' },
                { label: 'Stock bajo',         count: '3',     pct: 1,  color: 'var(--color-warning)' },
                { label: 'Sin stock',          count: '2',     pct: 0,  color: 'var(--color-danger)'  },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.count}</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-surface)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="dashboard__bottom-grid">

        {/* Top products */}
        <div className="panel">
          <div className="panel__header">
            <span className="panel__title">🏆 Productos más vendidos</span>
            <button className="panel__action">Ver ranking →</button>
          </div>
          <div className="panel__body">
            <div className="product-rank">
              {TOP_PRODUCTS.map((p, i) => (
                <div key={p.name} className="product-rank__item">
                  <span className="product-rank__pos">#{i + 1}</span>
                  <div className="product-rank__bar-wrap">
                    <p className="product-rank__name">{p.name}</p>
                    <div className="product-rank__bar-bg">
                      <div
                        className="product-rank__bar-fill"
                        style={{ width: `${(p.qty / MAX_QTY) * 100}%` }}
                        aria-label={`${p.qty} unidades`}
                      />
                    </div>
                  </div>
                  <span className="product-rank__qty">{p.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="panel">
          <div className="panel__header">
            <span className="panel__title">⚡ Acciones rápidas</span>
          </div>
          <div className="panel__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
              {[
                { icon: '💳', label: 'Nueva Venta',        color: 'green' },
                { icon: '📥', label: 'Entrada Inventario', color: 'sky'   },
                { icon: '🔄', label: 'Solicitar Traslado', color: 'amber' },
                { icon: '📊', label: 'Ver Reporte',        color: 'sky'   },
                { icon: '👥', label: 'Gestionar Usuarios', color: 'green' },
                { icon: '🏷️', label: 'Crear Oferta',       color: 'amber' },
              ].map((a) => (
                <button
                  key={a.label}
                  className="btn btn--ghost"
                  style={{
                    flexDirection: 'column',
                    padding: 'var(--sp-4)',
                    gap: 'var(--sp-2)',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sucursal performance */}
        <div className="panel">
          <div className="panel__header">
            <span className="panel__title">🏪 Rendimiento por sucursal</span>
            <button className="panel__action">Comparar →</button>
          </div>
          <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {[
              { name: 'Sucursal Central', sales: 'Q 89,400', pct: 63, badge: 'success' },
              { name: 'Sucursal Norte',   sales: 'Q 35,200', pct: 25, badge: 'info'    },
              { name: 'Sucursal Sur',     sales: 'Q 17,430', pct: 12, badge: 'warning' },
            ].map((s) => (
              <div key={s.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.sales}</span>
                    <span className={`badge badge--${s.badge}`}>{s.pct}%</span>
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${s.pct}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                    borderRadius: '999px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
