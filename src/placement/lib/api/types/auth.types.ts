import type { Identifiable, Timestamps, TenantScoped, PortalRole } from "./common.types";

export interface User extends Identifiable, Timestamps, TenantScoped {
  email: string;
  name: string;
  role: PortalRole;
  avatarUrl: string | null;
  department?: string;
  lastLoginAt: string | null;
  // Profile fields the admin captures on user creation. All optional so legacy
  // accounts (created before the placement form had these) still render.
  idNo?: string | null;
  designation?: string | null;
  specialization?: string | null;
  phone?: string | null;
  // True when the admin seeded the account with a temp/default password and
  // the user hasn't picked a real one yet. Drives the forced redirect to
  // /placement/setup-password on login and on session restore.
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
