import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';
import { useEffect, useState } from 'react';
import { LoadingDot } from '../components/common/LoadingDot';

export function ProtectedRoute(): JSX.Element {
  const { isAuthenticated, isServerVerified, onboarded, isHydrated } = useAuth();
  const [persistHydrated, setPersistHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (persistHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setPersistHydrated(true));
    setPersistHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, [persistHydrated]);

  const hydrated = isHydrated || persistHydrated;

  // Phase 1: wait for localStorage to load
  if (!hydrated) return <LoadingDot />;

  // Phase 2: localStorage loaded, no user → redirect immediately (skip server call)
  if (!isAuthenticated) {
    return <Navigate to={onboarded ? '/login' : '/onboarding'} replace />;
  }

  // Phase 3: user exists in store but server hasn't confirmed yet → wait for AuthInitializer
  if (!isServerVerified) return <LoadingDot />;

  // Phase 4: server confirmed → render the protected page
  return <Outlet />;
}
