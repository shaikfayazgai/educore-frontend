// Faculty API client. Single fetch wrapper with the cascade-logout
// interceptor: when the backend returns 401/403 with TENANT_* / ACCOUNT_*
// codes (because the user's university or account got suspended/deactivated
// since the token was issued), we redirect to /suspended with the
// lockoutToken so the user lands on the contact page automatically.
//
// Routing rules:
//   401 PASSWORD_NOT_SET     -> /reset-password (OTP setup flow)
//   401 UNAUTHORIZED         -> /login?reason=session_expired
//   403 PASSWORD_CHANGE_REQUIRED -> /change-password
//   403 ACCOUNT_*            -> /suspended?scope=account (lockoutToken stashed)
//   403 TENANT_*             -> /suspended?scope=tenant
//   any 2xx                  -> return data
import type { ApiResponse, ApiErrorResponse } from "./types/common.types";

const BASE_URL = process.env.NEXT_PUBLIC_FACULTY_API_BASE_URL || "";

// Routes that should bypass the cascade redirect (auth pages themselves).
const AUTH_PATHS = [
  "/faculty/login",
  "/faculty/forgot-password",
  "/faculty/reset-password",
  "/faculty/change-password",
  "/faculty/suspended",
];

const LOCKOUT_KEY = "glimmora_lockout_token";
const SUSPENDED_PAYLOAD_KEY = "glimmora_suspended_payload";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;
  /** Extra fields the server returned in the error body — used by the
   *  interceptor (lockoutToken, redirectTo) and by callers that want to
   *  inspect specific error data. */
  body?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>,
    body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.body = body;
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("glimmora_access_token");
}

/** Cross-tab cache for the lockout token + suspended-page metadata. */
export const sessionStore = {
  get lockoutToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(LOCKOUT_KEY);
  },
  setLockoutToken(token: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(LOCKOUT_KEY, token);
  },
  setSuspendedPayload(payload: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(SUSPENDED_PAYLOAD_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  },
  readSuspendedPayload(): Record<string, unknown> | null {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(SUSPENDED_PAYLOAD_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  clearLockout() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(LOCKOUT_KEY);
    sessionStorage.removeItem(SUSPENDED_PAYLOAD_KEY);
  },
};

function shouldBypassInterceptor(): boolean {
  if (typeof window === "undefined") return true;
  return AUTH_PATHS.some((p) => window.location.pathname.startsWith(p));
}

function handleErrorResponse(status: number, body: ApiErrorResponse | null) {
  if (typeof window === "undefined") return;
  const code = body?.error?.code ?? "UNKNOWN_ERROR";
  const message = body?.error?.message ?? "";
  const extra = (body?.error as Record<string, unknown>) ?? {};

  // Cascade logout flows. Bail out before throwing so the user gets a
  // redirect and the calling component can stop rendering.
  if (status === 401) {
    if (code === "PASSWORD_NOT_SET" && !shouldBypassInterceptor()) {
      window.location.assign("/faculty/reset-password");
      return true;
    }
    if (!shouldBypassInterceptor()) {
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
      window.location.assign("/faculty/login?reason=session_expired");
      return true;
    }
  }
  if (status === 403) {
    if (code === "PASSWORD_CHANGE_REQUIRED" && !shouldBypassInterceptor()) {
      window.location.assign("/faculty/change-password");
      return;
    }
    if (
      (code === "ACCOUNT_SUSPENDED" || code === "ACCOUNT_DEACTIVATED") &&
      !shouldBypassInterceptor()
    ) {
      const lockoutToken =
        typeof extra.lockoutToken === "string" ? extra.lockoutToken : "";
      if (lockoutToken) sessionStore.setLockoutToken(lockoutToken);
      sessionStore.setSuspendedPayload({ code, message, scope: "account" });
      window.location.assign("/faculty/suspended?scope=account");
      return true;
    }
    if (
      (code === "TENANT_SUSPENDED" || code === "TENANT_DEACTIVATED") &&
      !shouldBypassInterceptor()
    ) {
      const lockoutToken =
        typeof extra.lockoutToken === "string" ? extra.lockoutToken : "";
      if (lockoutToken) sessionStore.setLockoutToken(lockoutToken);
      sessionStore.setSuspendedPayload({ code, message, scope: "tenant" });
      window.location.assign("/faculty/suspended?scope=tenant");
      return true;
    }
  }
  return false;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // No-content responses are still valid.
  const text = await response.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const errorBody = (json ?? {}) as ApiErrorResponse;
    const redirecting = handleErrorResponse(response.status, errorBody);
    // If we're redirecting, return a pending promise so React Query never
    // settles — the browser will navigate before any re-render fires.
    if (redirecting) return new Promise(() => {}) as never;
    throw new ApiError(
      errorBody.error?.message || "An unexpected error occurred",
      errorBody.error?.code || "UNKNOWN_ERROR",
      response.status,
      errorBody.error?.details,
      errorBody.error as Record<string, unknown> | undefined,
    );
  }

  return (json ?? {}) as ApiResponse<T>;
}

export const api = {
  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { method: "GET" });
  },
  post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { method: "DELETE" });
  },
};
