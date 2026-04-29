import { api } from './api';
import { useAuthStore } from '../store/auth.store';
import type { CurrentUser } from '../shared';

export type OtpPurpose = 'verify_email' | 'reset_password';

interface RegisterResponse {
  message: string;
  email: string;
  otpSent: boolean;
}

interface VerifyOtpResult {
  message: string;
  user: CurrentUser;
}

export const authService = {
  async register(email: string, password: string, fullName: string): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register', {
      email,
      password,
      fullName,
    });
    return data;
  },

  async login(email: string, password: string): Promise<CurrentUser> {
    const { data } = await api.post<CurrentUser>('/auth/login', { email, password });
    useAuthStore.getState().setAuth(data);
    useAuthStore.getState().setServerVerified(true);
    return data;
  },

  async verifyOtp(email: string, otp: string, purpose: OtpPurpose): Promise<VerifyOtpResult> {
    const { data } = await api.post<VerifyOtpResult>('/auth/verify-otp', { email, otp, purpose });
    if (data?.user) {
      useAuthStore.getState().setAuth(data.user);
      useAuthStore.getState().setServerVerified(true);
    }
    return data;
  },

  async sendOtp(email: string, purpose: OtpPurpose): Promise<{ otpSent: boolean }> {
    const { data } = await api.post<{ otpSent: boolean }>('/auth/send-otp', { email, purpose });
    return data;
  },

  async checkAuth(): Promise<CurrentUser> {
    const { data } = await api.get<{ isAuthenticated: boolean; user: CurrentUser }>('/auth/check');
    useAuthStore.getState().setAuth(data.user);
    useAuthStore.getState().setServerVerified(true);
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  /** Reset password — user must be authenticated (cookies set after verifyOtp) */
  async resetPassword(newPassword: string): Promise<{ message: string; reset: boolean }> {
    const { data } = await api.post<{ message: string; reset: boolean }>('/auth/reset-password', {
      newPassword,
    });
    return data;
  },

  /** Change password — requires current password for verification */
  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string; changed: boolean }> {
    const { data } = await api.post<{ message: string; changed: boolean }>(
      '/auth/change-password',
      {
        oldPassword,
        newPassword,
      },
    );
    return data;
  },
};
