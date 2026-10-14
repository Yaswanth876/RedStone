import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';

/**
 * ProtectedRoute
 *
 * Wraps routes that require authentication.
 * - While session is restoring (isLoading), renders nothing to prevent flash.
 * - Unauthenticated visitors are redirected to /login with `from` state preserved.
 * - Authenticated users pass through.
 *
 * Usage in router:
 *   element: <ProtectedRoute><AppLayout /></ProtectedRoute>
 *   — or —
 *   element: <ProtectedRoute />   (uses <Outlet /> implicitly)
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait for session restore before making any routing decision
  if (isLoading) {
    return null; // No flash; layout shell renders once auth is confirmed
  }

  if (!isAuthenticated) {
    // Preserve the originally requested destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
