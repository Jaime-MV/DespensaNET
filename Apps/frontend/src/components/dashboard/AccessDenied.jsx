/**
 * src/components/dashboard/AccessDenied.jsx
 * Pantalla de acceso denegado para roles sin permiso al Dashboard Global.
 */
export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 p-8">
      <span className="text-7xl select-none">🔒</span>
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Esta sección es exclusiva para el rol <span className="font-semibold text-indigo-600">Propietario</span>.
          Si crees que esto es un error, contacta al administrador.
        </p>
      </div>
      <div className="px-5 py-2 rounded-full bg-red-100 text-red-600 text-xs font-bold tracking-widest uppercase">
        Sin Autorización
      </div>
    </div>
  );
}
