import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../views/Login';
import Dashboard from '../views/Dashboard';
import POS from '../views/POS';
import UsersList from '../views/Users/UsersList';
import Inventario from '../views/Inventario';
import OfertasBase from '../views/OfertasBase';

/**
 * AppRouter
 * Central routing configuration for DespensaNET.
 *
 * Role-based landing:
 *   Empleado → /ventas (POS)
 *   Others   → /dashboard
 */
function RoleRedirect() {
  // Reads user from session to decide landing page
  try {
    const raw = sessionStorage.getItem('despensanet_session');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.user?.role === 'Empleado') {
        return <Navigate to="/ventas" replace />;
      }
    }
  } catch { /* ignore */ }
  return <Navigate to="/dashboard" replace />;
}

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
            {/* Default: role-based redirect */}
            <Route index element={<RoleRedirect />} />

            {/* Dashboard (propietario/encargado) */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* POS — primary module for empleados */}
            <Route path="ventas" element={<POS />} />

            {/* Inventario CRUD y Marketing */}
            <Route path="inventario" element={<Inventario />} />
            <Route path="inventario/descuentos" element={<OfertasBase tipo="descuento" />} />
            <Route path="inventario/promociones" element={<OfertasBase tipo="promocion" />} />
            
            <Route path="traslados"     element={<PlaceholderView title="Traslados"      icon="🔄" />} />
            <Route path="alertas"       element={<PlaceholderView title="Alertas"        icon="🔔" />} />
            <Route path="reportes"      element={<PlaceholderView title="Reportes"       icon="📈" />} />
            <Route path="sucursales"    element={<PlaceholderView title="Sucursales"     icon="🏪" />} />
            <Route path="usuarios"      element={<UsersList />} />
            <Route path="ofertas"       element={<PlaceholderView title="Ofertas"        icon="🏷️" />} />
            <Route path="configuracion" element={<PlaceholderView title="Configuración"  icon="⚙️" />} />
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
───────────────────────────────────────────────────────── */
function PlaceholderView({ title, icon }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <span className="text-6xl">{icon}</span>
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-400 text-sm">Este módulo está en construcción.</p>
      </div>
      <div className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold tracking-wide">
        PRÓXIMAMENTE
      </div>
    </div>
  );
}
