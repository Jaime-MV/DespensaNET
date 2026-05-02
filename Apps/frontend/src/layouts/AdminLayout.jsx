import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AdminLayout.css';

/* ─────────────────────────────────────────
   Navigation definition
   Roles: propietario | encargado | empleado
───────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard',   icon: '📊', label: 'Dashboard',    roles: ['Propietario', 'Encargado', 'Empleado'] },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/inventario',  icon: '📦', label: 'Inventario',   roles: ['Propietario', 'Encargado', 'Empleado'] },
      { to: '/ventas',      icon: '💳', label: 'Ventas (POS)', roles: ['Propietario', 'Encargado', 'Empleado'] },
      { to: '/traslados',   icon: '🔄', label: 'Traslados',    roles: ['Propietario', 'Encargado'] },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/alertas',     icon: '🔔', label: 'Alertas',      roles: ['Propietario', 'Encargado'], badge: 3 },
      { to: '/reportes',    icon: '📈', label: 'Reportes',     roles: ['Propietario', 'Encargado'] },
      { to: '/sucursales',  icon: '🏪', label: 'Sucursales',   roles: ['Propietario'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/usuarios',    icon: '👥', label: 'Usuarios',     roles: ['Propietario'] },
      { to: '/ofertas',     icon: '🏷️', label: 'Ofertas',      roles: ['Propietario', 'Encargado'] },
      { to: '/configuracion', icon: '⚙️', label: 'Configuración', roles: ['Propietario'] },
    ],
  },
];

function getInitials(email = '') {
  return email.slice(0, 2).toUpperCase();
}

export default function AdminLayout() {
  const { user, logout }       = useAuth();
  const navigate               = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role ?? 'Empleado';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobile = () => setMobileOpen(false);

  /* Filter nav items by role */
  const filteredSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="admin-layout">

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <nav
        className={[
          'sidebar',
          collapsed ? 'sidebar--collapsed' : '',
          mobileOpen ? 'sidebar--mobile-open' : '',
        ].join(' ')}
        aria-label="Navegación principal"
      >
        {/* Collapse toggle (desktop only) */}
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? '›' : '‹'}
        </button>

        {/* Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__brand-icon" aria-hidden="true">🏪</div>
          <span className="sidebar__brand-name">
            Despensa<span>NET</span>
          </span>
        </div>

        {/* Navigation */}
        <div className="sidebar__nav">
          {filteredSections.map((section) => (
            <div key={section.label} className="sidebar__section">
              <p className="sidebar__section-label">{section.label}</p>
              <ul className="sidebar__nav-list">
                {section.items.map((item) => (
                  <li
                    key={item.to}
                    className="sidebar__nav-item"
                    data-label={item.label}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`
                      }
                      onClick={closeMobile}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="sidebar__nav-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="sidebar__nav-label">{item.label}</span>
                      {item.badge && (
                        <span className="sidebar__nav-badge">{item.badge}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* User card */}
        <div className="sidebar__user">
          <div className="sidebar__user-avatar" aria-hidden="true">
            {getInitials(user?.email)}
          </div>
          <div className="sidebar__user-info">
            <p className="sidebar__user-name">{user?.email ?? 'Usuario'}</p>
            <p className="sidebar__user-role">{role}</p>
          </div>
          <button
            className="sidebar__logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            🚪
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className={`admin-main${collapsed ? ' admin-main--collapsed' : ''}`}>

        {/* Topbar */}
        <header className="topbar">
          <button
            className="topbar__menu-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <h1 className="topbar__page-title" id="page-title">
            {/* Title injected by each view via document.title or context */}
          </h1>

          <div className="topbar__actions">
            {/* Notifications */}
            <button className="topbar__icon-btn" aria-label="Notificaciones" title="Alertas">
              🔔
              <span className="topbar__notif-dot" aria-hidden="true" />
            </button>

            {/* Search */}
            <button className="topbar__icon-btn" aria-label="Buscar" title="Buscar">
              🔍
            </button>

            <div className="topbar__divider" aria-hidden="true" />

            {/* User pill */}
            <div className="topbar__user-pill" role="button" tabIndex={0} aria-label="Perfil de usuario">
              <div className="topbar__user-avatar" aria-hidden="true">
                {getInitials(user?.email)}
              </div>
              <span className="topbar__user-name">{role}</span>
            </div>
          </div>
        </header>

        {/* Routed page content */}
        <main className="admin-page" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
