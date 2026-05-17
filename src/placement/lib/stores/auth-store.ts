import { create } from "zustand";
import type { User } from "@/placement/lib/api/types/auth.types";
import type { PortalRole } from "@/placement/lib/api/types/common.types";
import { api, ApiError } from "@/placement/lib/api/client";
import type { LoginRequest, LoginResponse } from "@/placement/lib/api/types/auth.types";

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
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
        credentials
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
    } catch (err) {
      if (err instanceof ApiError) {
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
      // Logout should succeed even if API call fails
    } finally {
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
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
      const user = response.data;
      set({
        user,
        accessToken: token,
        isAuthenticated: true,
        isInitialized: true,
      });
      // Mid-session check: if /api/auth/me now reports the user must
      // change their password (e.g. admin forced a reset while the tab
      // was open), bounce to setup-password — but only if they're not
      // already there. Mirrors the faculty auth-store pattern.
      if (
        user.mustChangePassword &&
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/placement/setup-password") &&
        !window.location.pathname.startsWith("/placement/login")
      ) {
        window.location.assign("/placement/setup-password");
      }
    } catch {
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
      set({ isInitialized: true });
    }
  },

  clearError: () => set({ error: null, fieldErrors: null }),
}));

export function useCurrentRole(): PortalRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}
