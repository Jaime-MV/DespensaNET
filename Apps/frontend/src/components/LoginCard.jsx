import { useState } from 'react';
import { authService } from '../services/api';
import './LoginCard.css';

/* ─────────────────────────────────────────────────────────────
   Demo users that mirror the RBAC roles defined in context.md
   In production these come from the NestJS /auth/login endpoint.
───────────────────────────────────────────────────────────── */
const DEMO_USERS = [
  {
    role: 'Propietario',
    badgeClass: 'login-card__demo-badge--owner',
    icon: '👑',
    email: 'propietario@despensanet.com',
    password: 'Admin2024!',
  },
  {
    role: 'Encargado',
    badgeClass: 'login-card__demo-badge--manager',
    icon: '🧑‍💼',
    email: 'encargado@despensanet.com',
    password: 'Manager2024!',
  },
  {
    role: 'Empleado',
    badgeClass: 'login-card__demo-badge--staff',
    icon: '👤',
    email: 'empleado@despensanet.com',
    password: 'Staff2024!',
  },
];

/**
 * LoginCard
 * Handles user credential input and calls the real
 * NestJS POST /api/auth/login endpoint.
 *
 * Props:
 *  onLoginSuccess({ accessToken, user }) – called on successful login.
 */
export default function LoginCard({ onLoginSuccess }) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  /* Fill credentials from demo box */
  const fillDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  /* Submit handler — calls POST /api/auth/login */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.login(email.trim(), password);
      // data = { accessToken, user: { id, email, nombre, role, sucursal } }
      onLoginSuccess?.(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (status === 400) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Datos inválidos.'));
      } else {
        setError('No se pudo conectar al servidor. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card" role="main">
      {/* ── Header ── */}
      <header className="login-card__header">
        <div className="login-card__logo" aria-hidden="true">🏪</div>
        <h2 className="login-card__title">Bienvenido de vuelta</h2>
        <p className="login-card__subtitle">
          Inicia sesión para acceder a tu panel
        </p>
      </header>

      {/* ── Error alert ── */}
      {error && (
        <div className="login-card__alert login-card__alert--error" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Login form ── */}
      <form
        id="login-form"
        className="login-card__form"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Email */}
        <div className="login-card__field">
          <label htmlFor="login-email" className="login-card__label">
            Correo electrónico
          </label>
          <div className="login-card__input-wrap">
            <input
              id="login-email"
              type="email"
              className="login-card__input"
              placeholder="usuario@despensanet.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
            <span className="login-card__input-icon" aria-hidden="true">✉️</span>
          </div>
        </div>

        {/* Password */}
        <div className="login-card__field">
          <label htmlFor="login-password" className="login-card__label">
            Contraseña
          </label>
          <div className="login-card__input-wrap">
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              className="login-card__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
            <span className="login-card__input-icon" aria-hidden="true">🔒</span>
            <button
              type="button"
              className="login-card__pw-toggle"
              aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPw((v) => !v)}
              disabled={loading}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Forgot */}
        <div className="login-card__forgot">
          <a href="#forgot">¿Olvidaste tu contraseña?</a>
        </div>

        {/* Submit */}
        <button
          id="login-submit-btn"
          type="submit"
          className="login-card__submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="login-card__spinner" aria-hidden="true" />
              Iniciando sesión…
            </>
          ) : (
            'Iniciar Sesión →'
          )}
        </button>
      </form>

      {/* ── Demo credentials ── */}
      <div className="login-card__divider">Acceso rápido (demo)</div>

      <div className="login-card__demo">
        <p className="login-card__demo-title">Usuarios de prueba</p>
        <ul className="login-card__demo-roles">
          {DEMO_USERS.map((u) => (
            <li key={u.role}>
              <button
                type="button"
                className="login-card__demo-role"
                onClick={() => fillDemo(u)}
                title={`Usar credenciales de ${u.role}`}
              >
                <span className={`login-card__demo-badge ${u.badgeClass}`}>
                  {u.icon} {u.role}
                </span>
                <span className="login-card__demo-creds">{u.email}</span>
                <span className="login-card__demo-use">Usar →</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="login-card__footer-note">
        DespensaNET v0.1.0 · API: localhost:3000
      </p>
    </div>
  );
}
