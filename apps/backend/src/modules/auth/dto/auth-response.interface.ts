export interface AuthResponse {
  id: string;
  email: string;
  fullName: string;
  profileImage: string | null;
  dateOfBirth: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenResponse {
  refreshed: boolean;
}

export interface LogoutResponse {
  message: string;
  loggedOut: boolean;
}

export interface SignupResponse {
  message: string;
  email: string;
  role: string;
  otpSent: boolean;
}

export interface VerifyOtpResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface SendOtpResponse {
  otpSent: boolean;
}

export interface SetupProfileResponse {
  id: string;
  email: string;
  fullName: string;
  profileImage: string | null;
  isEmailVerified: boolean;
  dateOfBirth: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangePasswordResponse {
  message: string;
  changed: boolean;
}

export interface ResetPasswordResponse {
  message: string;
  reset: boolean;
}

export interface CheckAuthResponse {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    profileImage: string | null;
    dateOfBirth: string | null;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
