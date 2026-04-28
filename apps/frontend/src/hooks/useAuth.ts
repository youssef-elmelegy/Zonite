import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const onboarded = useAuthStore((s) => s.onboarded);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isServerVerified = useAuthStore((s) => s.isServerVerified);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const setServerVerified = useAuthStore((s) => s.setServerVerified);

  return {
    user,
    onboarded,
    isHydrated,
    isServerVerified,
    isAuthenticated: !!user,
    setAuth,
    clearAuth,
    setOnboarded,
    setServerVerified,
  };
}
