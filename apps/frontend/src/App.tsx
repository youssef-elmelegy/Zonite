import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useAuthStore } from './store/auth.store';
import { authService } from './services/auth.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthInitializer() {
  useEffect(() => {
    void authService.checkAuth().catch(() => {
      // 401 → server said not authenticated; clearAuth already called inside checkAuth's
      // error path via the axios 401 interceptor → clearAuth() + redirect only if _retry fails.
      // Here we just suppress the unhandled rejection.
      const { clearAuth, setServerVerified } = useAuthStore.getState();
      clearAuth();
      // Mark verification as complete even on failure so routes unblock
      setServerVerified(true);
    });
  }, []);
  return null;
}

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
