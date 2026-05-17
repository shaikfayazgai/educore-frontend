import { create } from "zustand";
import type { User } from "@/admin/lib/api/types/auth.types";
import type { PortalRole } from "@/admin/lib/api/types/common.types";
import { api, ApiError } from "@/admin/lib/api/client";
import type { LoginRequest, LoginResponse } from "@/admin/lib/api/types/auth.types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;

  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  /** Patch fields on the cached user (used after change-password to clear mustChangePassword). */
  setUser: (patch: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  fieldErrors: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null, fieldErrors: null });

    try {
      const response = await api.post<LoginResponse>(
        "/api/auth/login",
        credentials,
      );

      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem("glimmora_access_token", accessToken);
      localStorage.setItem("glimmora_refresh_token", refreshToken);

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        fieldErrors: null,
      });

      // Forced password change for newly-provisioned accounts (any role).
      if (user.mustChangePassword && typeof window !== "undefined") {
        window.location.assign("/admin/change-password");
        return;
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Account exists but has no password yet → push to /setup-password.
        if (err.code === "PASSWORD_NOT_SET" && typeof window !== "undefined") {
          const email = encodeURIComponent(credentials.email || "");
          set({ isLoading: false, error: null, fieldErrors: null });
          window.location.assign(`/admin/setup-password?email=${email}`);
          return;
        }
        // Maintenance mode → bounce to dedicated /maintenance page.
        // The api client also fires `window.location.replace("/maintenance")`
        // but that's racey with React's render cycle — without an explicit
        // case here the user sees "An unexpected error occurred" flash
        // briefly because the catch block runs the generic fallback before
        // the navigation completes. Setting error to null first prevents
        // any flash, then we navigate.
        if (err.code === "MAINTENANCE_MODE" && typeof window !== "undefined") {
          set({ isLoading: false, error: null, fieldErrors: null });
          window.location.assign("/admin/maintenance");
          return;
        }
        // Suspended / deactivated tenant or account → full lockout page.
        // Server includes a short-lived `lockoutToken` in the error body so
        // the contact form on the lockout page can submit complaints
        // without re-prompting for the password.
        if (
          (err.code === "ACCOUNT_SUSPENDED" || err.code === "ACCOUNT_DEACTIVATED") &&
          typeof window !== "undefined"
        ) {
          const lockoutToken =
            typeof err.body?.lockoutToken === "string" ? err.body.lockoutToken : "";
          if (lockoutToken) {
            sessionStorage.setItem("glimmora_lockout_token", lockoutToken);
          }
          const reason = encodeURIComponent(err.message || "");
          const email = encodeURIComponent(credentials.email || "");
          const variant =
            err.code === "ACCOUNT_DEACTIVATED" ? "deactivated" : "suspended";
          set({ isLoading: false, error: null, fieldErrors: null });
          window.location.assign(
            `/admin/account-suspended?reason=${reason}&email=${email}&variant=${variant}`,
          );
          return;
        }
        set({
          isLoading: false,
          error: err.message,
          fieldErrors: err.details || null,
        });
      } else {
        set({
          isLoading: false,
          error: "An unexpected error occurred. Please try again.",
          fieldErrors: null,
        });
      }
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // Logout should succeed even if the API call fails
    } finally {
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
      sessionStorage.removeItem("glimmora_lockout_token");
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        error: null,
        fieldErrors: null,
      });
    }
  },

  initialize: async () => {
    const token = localStorage.getItem("glimmora_access_token");

    if (!token) {
      set({ isInitialized: true });
      return;
    }

    try {
      const response = await api.get<User>("/api/auth/me");
      set({
        user: response.data,
        accessToken: token,
        isAuthenticated: true,
        isInitialized: true,
      });
    } catch {
      // 401/403 — clear and let the user log in again. The client.ts
      // bouncer already handled the suspended/deactivated codes.
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
      set({ isInitialized: true });
    }
  },

  clearError: () => set({ error: null, fieldErrors: null }),

  setUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : {})),
}));

export function useCurrentRole(): PortalRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}
