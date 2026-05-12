import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const role   = user?.role   ?? 'Empleado';
  const nombre = user?.nombre ?? user?.email ?? 'Usuario';

  useEffect(() => {
    document.title = 'Dashboard · DespensaNET';
  }, []);

  return (
    <div className="p-8 min-h-screen bg-gray-50 w-full">
      <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            👋 Hola, {nombre.split(' ')[0]}
            <span className="ml-3 text-sm font-medium bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full">
              {role}
            </span>
          </h2>
        </div>
        <button 
          onClick={logout} 
          className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Cerrar Sesión
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Panel en construcción</h3>
        <p className="text-gray-500 max-w-md">
          El contenido de este panel principal ha sido limpiado y se diseñará próximamente.
        </p>
      </div>
    </div>
  );
}
