import { create } from "zustand";
import type { User } from "@/superadmin/lib/api/types/auth.types";
import type { PortalRole } from "@/superadmin/lib/api/types/common.types";
import { api, ApiError } from "@/superadmin/lib/api/client";
import {
  clearStoredAuth,
  getStoredAuthUser,
  getStoredAccessToken,
  storeAuthUser,
  storeAuthTokens,
} from "@/superadmin/lib/auth/token-storage";
import type { LoginRequest, LoginResponse } from "@/superadmin/lib/api/types/auth.types";

const loggedOutState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  fieldErrors: null,
};

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
  validateSession: () => Promise<boolean>;
  clearSession: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
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

      storeAuthTokens(accessToken, refreshToken);
      storeAuthUser(user);

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
      clearStoredAuth();
      set({ ...loggedOutState, isInitialized: true });
    }
  },

  initialize: async () => {
    await get().validateSession();
  },

  validateSession: async () => {
    const token = getStoredAccessToken();

    if (!token) {
      clearStoredAuth();
      set({ ...loggedOutState, isInitialized: true });
      return false;
    }

    try {
      const response = await api.get<User>("/api/auth/me");
      storeAuthUser(response.data);
      set({
        user: response.data,
        accessToken: getStoredAccessToken(),
        isAuthenticated: true,
        isInitialized: true,
        error: null,
        fieldErrors: null,
      });
      return true;
    } catch (err) {
      if (err instanceof ApiError && [401, 403].includes(err.status)) {
        clearStoredAuth();
        set({ ...loggedOutState, isInitialized: true });
        return false;
      }

      const cachedUser = getStoredAuthUser<User>();
      if (cachedUser) {
        set({
          user: cachedUser,
          accessToken: token,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null,
          fieldErrors: null,
        });
        return true;
      }

      set({ ...loggedOutState, isInitialized: true });
      return false;
    }
  },

  clearSession: () => {
    clearStoredAuth();
    set({ ...loggedOutState, isInitialized: true });
  },

  clearError: () => set({ error: null, fieldErrors: null }),

  setUser: (user: User) => set({ user }),
}));

export function useCurrentRole(): PortalRole | null {
  return useAuthStore((s) => s.user?.role ?? null);
}
