import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';

/**
 * GuestRoute
 *
 * Wraps public routes like /login and /register.
 * Authenticated users are redirected to /dashboard (or wherever they came from).
 * During session restore, renders the children immediately so the auth pages
 * appear without delay; the redirect fires once isLoading settles.
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isLoading && isAuthenticated) {
    // Redirect back to the page they originally tried to visit, or /dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
}

export default GuestRoute;
