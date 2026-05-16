import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { usersService } from '../../services/users.service';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const ROLE_OPTIONS = [
  { value: 1, label: 'Propietario' },
  { value: 2, label: 'Encargado'  },
  { value: 3, label: 'Empleado'   },
];

const EMPTY_FORM = {
  nombre:     '',
  correo:     '',
  contrasena: '',
  id_rol:     3,
  id_sucursal: '',
  activo:     true,
};

/* ─────────────────────────────────────────────
   UserFormModal
   Props:
     - open        Boolean — controls visibility
     - onClose     () => void
     - onSuccess   (message) => void — fires toast
     - editUser    object | null — if set, we're editing
     - actorRole   'Propietario' | 'Encargado'
     - actorSucursalId  number | null
     - createUser  (payload) => Promise
     - updateUser  (id, payload) => Promise
───────────────────────────────────────────── */
export default function UserFormModal({
  open,
  onClose,
  onSuccess,
  editUser,
  actorRole,
  actorSucursalId,
  createUser,
  updateUser,
}) {
  const isOwner    = actorRole === 'Propietario';
  const isEditing  = Boolean(editUser);

  const [form, setForm]           = useState(EMPTY_FORM);
  const [branches, setBranches]   = useState([]);
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  // Populate form when editUser changes
  useEffect(() => {
    if (!open) return;
    if (editUser) {
      setForm({
        nombre:      editUser.nombre     ?? '',
        correo:      editUser.correo     ?? '',
        contrasena:  '',                        // never pre-filled
        id_rol:      editUser.id_rol     ?? 3,
        id_sucursal: editUser.id_sucursal ?? '',
        activo:      editUser.activo     ?? true,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFormError('');
    setShowPass(false);
  }, [open, editUser]);

  // Load branches only when Propietario needs to choose them
  useEffect(() => {
    if (!open || !isOwner) return;
    usersService.getBranches()
      .then((data) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]));
  }, [open, isOwner]);

  if (!open) return null;

  /* ── Helpers ── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const isOwnerRole = Number(form.id_rol) === 1; // rol 1 = propietario

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (!form.nombre.trim())  return setFormError('El nombre es obligatorio');
    if (!form.correo.trim())  return setFormError('El correo es obligatorio');
    if (!isEditing && !form.contrasena) return setFormError('La contraseña es obligatoria');
    if (form.contrasena && form.contrasena.length < 6)
      return setFormError('La contraseña debe tener al menos 6 caracteres');

    setSaving(true);
    try {
      const payload = {
        nombre:  form.nombre,
        correo:  form.correo,
        activo:  form.activo,
        ...(form.contrasena ? { contrasena: form.contrasena } : {}),
        ...(isOwner ? {
          id_rol:      Number(form.id_rol),
          id_sucursal: isOwnerRole ? undefined : (Number(form.id_sucursal) || undefined),
        } : {}),
      };

      if (isEditing) {
        await updateUser(editUser.id_usuario, payload);
        onSuccess('Usuario actualizado correctamente');
      } else {
        await createUser(payload);
        onSuccess('Usuario creado correctamente');
      }
      onClose();
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Ocurrió un error al guardar');
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-800">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Nombre completo
            </label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Ej. Juan Pérez"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Correo electrónico
            </label>
            <input
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              required
              placeholder="juan@empresa.com"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Contraseña {isEditing && <span className="font-normal text-slate-400 normal-case">(dejar en blanco para no cambiar)</span>}
            </label>
            <div className="relative">
              <input
                name="contrasena"
                type={showPass ? 'text' : 'password'}
                value={form.contrasena}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Rol (solo propietario) */}
          {isOwner && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Rol
              </label>
              <select
                name="id_rol"
                value={form.id_rol}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sucursal (solo propietario, oculto si rol=propietario) */}
          {isOwner && !isOwnerRole && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Sucursal
              </label>
              <select
                name="id_sucursal"
                value={form.id_sucursal}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">— Seleccionar sucursal —</option>
                {branches.map((b) => (
                  <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {/* Encargado: info badge */}
          {!isOwner && (
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs rounded-lg px-3 py-2 border border-indigo-100">
              <span className="font-semibold">ℹ</span>
              <span>
                El usuario será creado como <strong>Empleado</strong> en tu sucursal.
              </span>
            </div>
          )}

          {/* Estado activo (solo en edición) */}
          {isEditing && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado activo</span>
              <div className="relative">
                <input
                  name="activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-indigo-600 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className={`text-xs font-medium ${form.activo ? 'text-emerald-600' : 'text-slate-400'}`}>
                {form.activo ? 'Activo' : 'Inactivo'}
              </span>
            </label>
          )}

          {/* Error */}
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : isEditing ? 'Actualizar' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
