import { create } from "zustand";
import type { User } from "@/faculty/lib/api/types/auth.types";
import type { PortalRole } from "@/faculty/lib/api/types/common.types";
import { api, ApiError } from "@/faculty/lib/api/client";
import type { LoginRequest, LoginResponse } from "@/faculty/lib/api/types/auth.types";

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
  /** Patch fields on the cached user (used after change-password). */
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
      if (refreshToken) {
        localStorage.setItem("glimmora_refresh_token", refreshToken);
      }

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        fieldErrors: null,
      });

      // Forced password change for newly-provisioned accounts. Backend
      // hard-blocks portal endpoints (403 PASSWORD_CHANGE_REQUIRED) until
      // the flag clears — this redirect just gets the user there faster.
      if (user.mustChangePassword && typeof window !== "undefined") {
        window.location.assign("/faculty/change-password");
        return;
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Account exists but has no password yet → /reset-password OTP flow.
        if (err.code === "PASSWORD_NOT_SET" && typeof window !== "undefined") {
          set({ isLoading: false, error: null, fieldErrors: null });
          window.location.assign("/faculty/reset-password");
          return;
        }
        // Tenant/account suspension redirects are handled by the API client
        // interceptor — fall through to surface the message inline too.
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

      // Returning user still owes a password reset — bounce.
      if (
        response.data.mustChangePassword &&
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/faculty/change-password") &&
        !window.location.pathname.startsWith("/faculty/login")
      ) {
        window.location.assign("/faculty/change-password");
      }
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
