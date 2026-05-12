import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginCard from '../components/LoginCard';

/**
 * Login view
 * Public page. Renders LoginCard.
 * On successful login redirects to /dashboard via navigate().
 */
export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  // Already authenticated → go straight to the app (RoleRedirect will handle it)
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLoginSuccess = (data) => {
    // data = { accessToken, user: { id, email, nombre, role, sucursal } }
    login(data);
    navigate('/', { replace: true });
  };

  return <LoginCard onLoginSuccess={handleLoginSuccess} />;
}
