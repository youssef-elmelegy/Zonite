import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingDot } from '../components/common/LoadingDot';

export function GuestRoute(): JSX.Element {
  const { isAuthenticated, isServerVerified, isHydrated } = useAuth();

  // Wait for localStorage to hydrate
  if (!isHydrated) return <LoadingDot />;

  // No user in store at all → let them through immediately (avoids waiting for server)
  if (!isAuthenticated) return <Outlet />;

  // User exists in store but server check still in-flight → wait
  if (!isServerVerified) return <LoadingDot />;

  // Server confirmed they're logged in → send them home
  return <Navigate to="/home" replace />;
}
