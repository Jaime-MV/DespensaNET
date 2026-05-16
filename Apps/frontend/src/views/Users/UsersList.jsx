import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useUsers';
import UserFormModal from '../../components/users/UserFormModal';
import {
  Plus, RefreshCw, UserX, Pencil,
  ShieldOff, CheckCircle, XCircle, Loader2,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Toast — lightweight inline notification
───────────────────────────────────────────── */
function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RoleBadge
───────────────────────────────────────────── */
const ROLE_STYLES = {
  propietario: 'bg-purple-100 text-purple-700',
  encargado:   'bg-blue-100 text-blue-700',
  empleado:    'bg-slate-100 text-slate-600',
};
function RoleBadge({ rol }) {
  const key = (rol ?? '').toLowerCase();
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_STYLES[key] ?? 'bg-slate-100 text-slate-600'}`}>
      {rol}
    </span>
  );
}

/* ─────────────────────────────────────────────
   StatusBadge
───────────────────────────────────────────── */
function StatusBadge({ activo }) {
  return activo ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactivo
    </span>
  );
}

/* ─────────────────────────────────────────────
   AccessDenied
───────────────────────────────────────────── */
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <ShieldOff className="w-10 h-10 text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Acceso Denegado</h2>
        <p className="text-slate-500 text-sm max-w-xs">
          No tienes permisos para acceder a la gestión de usuarios.
        </p>
      </div>
      <span className="px-4 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-full tracking-wide uppercase">
        Solo Propietario / Encargado
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   UsersList — main view
───────────────────────────────────────────── */
export default function UsersList() {
  const { user } = useAuth();
  const actorRole       = user?.role;           // 'Propietario' | 'Encargado' | 'Empleado'
  const actorSucursalId = user?.idSucursal;     // number | null

  const { users, loading, error, fetchUsers, createUser, updateUser, deactivateUser } = useUsers();

  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // null = new user
  const [toast, setToast]           = useState(null);   // { message, type }
  const [deactivating, setDeactivating] = useState(null); // id being deactivated

  const isOwner     = actorRole === 'Propietario';
  const showBranch  = isOwner;                          // column visibility rule

  /* ── Guard: empleados no tienen acceso ── */
  if (actorRole === 'Empleado') return <AccessDenied />;

  /* ── Initial load ── */
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (u)  => { setEditTarget(u);  setModalOpen(true); };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`¿Desactivar la cuenta de "${u.nombre}"?`)) return;
    setDeactivating(u.id_usuario);
    try {
      await deactivateUser(u.id_usuario);
      showToast(`"${u.nombre}" ha sido desactivado`);
    } catch (err) {
      showToast(err?.response?.data?.message ?? 'Error al desactivar', 'error');
    } finally {
      setDeactivating(null);
    }
  };

  /* ── Render ── */
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isOwner
              ? 'Administra usuarios de todas las sucursales.'
              : 'Administra los empleados de tu sucursal.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stats summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total',    value: users.length,                            color: 'indigo' },
          { label: 'Activos',  value: users.filter((u) => u.activo).length,   color: 'emerald' },
          { label: 'Inactivos',value: users.filter((u) => !u.activo).length,  color: 'slate' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
            <span className={`text-2xl font-extrabold text-${color}-600 mt-1 tabular-nums`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando usuarios…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <UserX className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron usuarios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs uppercase tracking-wider text-slate-500 text-left">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold">Correo</th>
                  <th className="px-5 py-3 font-semibold">Rol</th>
                  {showBranch && <th className="px-5 py-3 font-semibold">Sucursal</th>}
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-400 text-xs">#{u.id_usuario}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{u.nombre}</td>
                    <td className="px-5 py-3 text-slate-500">{u.correo}</td>
                    <td className="px-5 py-3"><RoleBadge rol={u.rol} /></td>
                    {showBranch && (
                      <td className="px-5 py-3 text-slate-500">{u.sucursal ?? <span className="text-slate-300">—</span>}</td>
                    )}
                    <td className="px-5 py-3"><StatusBadge activo={u.activo} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Deactivate (only if active) */}
                        {u.activo && (
                          <button
                            onClick={() => handleDeactivate(u)}
                            disabled={deactivating === u.id_usuario}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Desactivar"
                          >
                            {deactivating === u.id_usuario
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <UserX className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── User Form Modal ── */}
      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
        editUser={editTarget}
        actorRole={actorRole}
        actorSucursalId={actorSucursalId}
        createUser={createUser}
        updateUser={updateUser}
      />

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
