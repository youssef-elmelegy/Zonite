import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CurrentUser } from '../shared';

interface AuthState {
  user: CurrentUser | null;
  onboarded: boolean;
  isHydrated: boolean;
  isServerVerified: boolean;
  setAuth: (user: CurrentUser) => void;
  clearAuth: () => void;
  setOnboarded: () => void;
  setServerVerified: (verified: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      onboarded: false,
      isHydrated: false,
      isServerVerified: false,
      setAuth: (user) => set({ user }),
      clearAuth: () =>
        set((s) => ({
          user: null,
          isServerVerified: false,
          onboarded: s.onboarded,
        })),
      setOnboarded: () => set({ onboarded: true }),
      setServerVerified: (verified) => set({ isServerVerified: verified }),
    }),
    {
      name: 'zonite-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        onboarded: state.onboarded,
        // isServerVerified intentionally excluded — must re-verify each session
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration as complete
        if (state) {
          state.isHydrated = true;
        }
      },
    },
  ),
);

// Fallback: Force hydration complete after 1s in case callback doesn't fire
setTimeout(() => {
  useAuthStore.setState({ isHydrated: true });
}, 1000);
