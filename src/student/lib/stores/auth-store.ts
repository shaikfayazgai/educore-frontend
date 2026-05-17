import { create } from "zustand";
import { api, ApiError } from "@/student/lib/api/client";
import type {
  LoginRequest,
  LoginResponse,
  User,
} from "@/student/lib/api/types/auth.types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  errorCode: string | null;
  fieldErrors: Record<string, string[]> | null;

  login: (credentials: LoginRequest) => Promise<void>;
  logout: (opts?: { silent?: boolean }) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

const TOKEN_KEY = "glimmora_access_token";
const REFRESH_KEY = "glimmora_refresh_token";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  errorCode: null,
  fieldErrors: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null, errorCode: null, fieldErrors: null });
    try {
      const response = await api.post<LoginResponse>("/api/auth/login", credentials);
      const { user, accessToken, refreshToken } = response.data;
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
      set({
        user, accessToken, isAuthenticated: true,
        isLoading: false, error: null, errorCode: null, fieldErrors: null,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        set({
          isLoading: false,
          error: err.message,
          errorCode: err.code,
          fieldErrors: err.details || null,
        });
      } else {
        set({
          isLoading: false,
          error: "An unexpected error occurred. Please try again.",
          errorCode: "UNKNOWN",
          fieldErrors: null,
        });
      }
      throw err;
    }
  },

  logout: async (opts) => {
    try {
      if (!opts?.silent) await api.post("/api/auth/logout");
    } catch {
      /* clear locally anyway */
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      set({
        user: null, accessToken: null, isAuthenticated: false,
        error: null, errorCode: null, fieldErrors: null,
      });
    }
  },

  initialize: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
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
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      const code = err instanceof ApiError ? err.code : "UNAUTHORIZED";
      set({
        user: null, accessToken: null, isAuthenticated: false,
        isInitialized: true, errorCode: code,
      });
    }
  },

  clearError: () => set({ error: null, errorCode: null, fieldErrors: null }),
}));
