/**
 * src/layouts/AdminLayout.jsx
 * Layout principal de la aplicación.
 * Integra el Sidebar corporativo con el área de contenido.
 */
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
