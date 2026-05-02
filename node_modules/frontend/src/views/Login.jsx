import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import LoginCard from '../components/LoginCard';

/**
 * Login view
 * Public page. Renders AuthLayout + LoginCard.
 * On successful login redirects to /dashboard via navigate().
 */
export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  // Already authenticated → go straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginSuccess = (data) => {
    // data = { accessToken, user: { id, email, nombre, role, sucursal } }
    login(data);
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthLayout>
      <LoginCard onLoginSuccess={handleLoginSuccess} />
    </AuthLayout>
  );
}
