import './App.css';
import AppRouter from './routes/AppRouter';

/**
 * App — root component.
 * Renders the router which wraps everything in <AuthProvider>.
 */
export default function App() {
  return <AppRouter />;
}
