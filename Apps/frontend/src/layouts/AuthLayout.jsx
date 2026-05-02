import './AuthLayout.css';

/**
 * AuthLayout
 * Two-column layout: left branding panel + right content slot.
 * Used for Login and future auth pages.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">

      {/* Animated background */}
      <div className="auth-layout__bg" aria-hidden="true">
        <div className="auth-layout__grid" />
        <div className="auth-layout__blob auth-layout__blob--1" />
        <div className="auth-layout__blob auth-layout__blob--2" />
      </div>

      {/* Left — Brand panel */}
      <aside className="auth-layout__brand">
        {/* Logo */}
        <div className="auth-layout__logo-wrap">
          <div className="auth-layout__logo-icon" aria-hidden="true">🏪</div>
          <span className="auth-layout__logo-text">
            Despensa<span>NET</span>
          </span>
        </div>

        {/* Hero copy */}
        <div className="auth-layout__hero">
          <h1 className="auth-layout__headline">
            Gestiona tu inventario<br />
            <em>de forma inteligente</em>
          </h1>

          <ul className="auth-layout__features">
            {[
              { icon: '📦', text: 'Inventario multi-sucursal en tiempo real' },
              { icon: '📊', text: 'Reportes y analítica de ventas' },
              { icon: '🔔', text: 'Alertas automáticas de stock mínimo' },
              { icon: '🔐', text: 'Control de acceso basado en roles (RBAC)' },
            ].map((f) => (
              <li key={f.text} className="auth-layout__feature">
                <span className="auth-layout__feature-icon">{f.icon}</span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-layout__footer-brand">
          © {new Date().getFullYear()} DespensaNET · Todos los derechos reservados
        </p>
      </aside>

      {/* Right — Login form slot */}
      <main className="auth-layout__content">
        {children}
      </main>
    </div>
  );
}
