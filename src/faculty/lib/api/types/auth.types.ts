import type { Identifiable, Timestamps, TenantScoped, PortalRole } from "./common.types";

export interface User extends Identifiable, Timestamps, TenantScoped {
  email: string;
  name: string;
  role: PortalRole;
  avatarUrl: string | null;
  department?: string;
  lastLoginAt: string | null;
  /** Set when admin onboards the user with a temp password — blocks
   *  portal access until /change-password completes. */
  mustChangePassword?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}
