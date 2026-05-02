import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../views/Login';
import Dashboard from '../views/Dashboard';

/**
 * AppRouter
 * Central routing configuration for DespensaNET.
 *
 * Structure:
 *   /               → redirect to /login
 *   /login          → Login page (public)
 *   /dashboard      → Protected admin shell
 *     index         → Dashboard view
 *     (future routes added here inside AdminLayout)
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Default: redirect / → /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* ── Placeholder routes (add views as you build them) ── */}
            <Route path="inventario"    element={<PlaceholderView title="Inventario"          icon="📦" />} />
            <Route path="ventas"        element={<PlaceholderView title="Ventas / POS"         icon="💳" />} />
            <Route path="traslados"     element={<PlaceholderView title="Traslados"            icon="🔄" />} />
            <Route path="alertas"       element={<PlaceholderView title="Alertas"              icon="🔔" />} />
            <Route path="reportes"      element={<PlaceholderView title="Reportes"             icon="📈" />} />
            <Route path="sucursales"    element={<PlaceholderView title="Sucursales"           icon="🏪" />} />
            <Route path="usuarios"      element={<PlaceholderView title="Usuarios"             icon="👥" />} />
            <Route path="ofertas"       element={<PlaceholderView title="Ofertas"              icon="🏷️" />} />
            <Route path="configuracion" element={<PlaceholderView title="Configuración"        icon="⚙️" />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

/* ─────────────────────────────────────────────────────────
   PlaceholderView
   Temporary "coming soon" screen for routes not yet built.
   Replace each one with its real view as you develop it.
───────────────────────────────────────────────────────── */
function PlaceholderView({ title, icon }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 'var(--sp-5)',
      animation: 'pageFadeIn 0.35s ease both',
    }}>
      <span style={{ fontSize: '64px' }}>{icon}</span>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Este módulo está en construcción. Pronto estará disponible.
        </p>
      </div>
      <div style={{
        padding: '8px 18px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-primary-glow)',
        color: 'var(--color-primary-light)',
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.5px',
      }}>
        PRÓXIMAMENTE
      </div>
    </div>
  );
}
