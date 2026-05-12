import { useState } from 'react';
import { Building2, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api';

export default function LoginCard({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor ingrese email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(email.trim(), password);
      onLoginSuccess?.(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (status === 400) {
        const msg = err?.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Datos inválidos.'));
      } else {
        setError(`No se pudo conectar al servidor. Detalle: ${err.message || 'Desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    { email: 'propietario@despensanet.com', password: 'Admin2024!', role: 'Propietario (acceso global)' },
    { email: 'encargado@despensanet.com', password: 'Manager2024!', role: 'Encargado Sucursal Central' },
    { email: 'empleado@despensanet.com', password: 'Staff2024!', role: 'Empleado Sucursal Norte' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 w-full">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-full mb-4">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl text-gray-900 mb-2 font-semibold text-center">DespensaNET</h1>
            <p className="text-gray-600 text-center">Gestión Corporativa Multi-Sucursal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="usuario@despensanet.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">Cuentas de demostración:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {demoCredentials.map((cred, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                    setError('');
                  }}
                  className="w-full text-left p-3 bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <p className="text-sm font-medium text-gray-900">{cred.role}</p>
                  <p className="text-xs text-gray-500">{cred.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Sistema conectado a PostgreSQL (Render)
        </p>
      </div>
    </div>
  );
}
