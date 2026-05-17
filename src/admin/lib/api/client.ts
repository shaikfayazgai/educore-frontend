import type { ApiResponse, ApiErrorResponse } from "./types/common.types";

const BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;
  /** Full error body so callers can read auxiliary fields like lockoutToken. */
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

/**
 * When any authenticated call returns 403 ACCOUNT_SUSPENDED / ACCOUNT_DEACTIVATED,
 * we wipe local creds and bounce to the lockout page. This is what catches
 * mid-session bans (admin OR faculty/student/placement — all roles get the
 * same 403 because the backend's `get_current_user` dep is shared).
 *
 * Skip on `/api/auth/login` because the auth-store handles that flow itself
 * (and adds the email + lockoutToken to the URL).
 */
/** Best-effort decode of the JWT's payload — used to lift the user's email
 *  AND role off the access token before we wipe it on a mid-session bounce,
 *  so the lockout page can switch UI (admin vs faculty/student) and pre-fill
 *  the contact form. */
function decodeJwtFields(token: string | null): { email: string; role: string } {
  const empty = { email: "", role: "" };
  if (!token) return empty;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return empty;
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (padded.length % 4)) % 4);
    const payload = JSON.parse(atob(padded + padding));
    return {
      email: typeof payload.email === "string" ? payload.email : "",
      role: typeof payload.role === "string" ? payload.role : "",
    };
  } catch {
    return empty;
  }
}

/** Bounce the SPA to `/maintenance` when the backend reports the
 *  platform is in maintenance mode. Distinct from account-suspended
 *  because:
 *    * It's not user-specific — anyone hitting any endpoint will see it.
 *    * Tokens stay intact (the freeze is temporary; we don't want the
 *      user to have to re-login the moment the platform comes back).
 *  Triggered by HTTP 503 + error code MAINTENANCE_MODE from the
 *  feature_flags middleware on UniBackend. */
function maybeBounceOnMaintenance(status: number, code: string) {
  if (typeof window === "undefined") return;
  if (status !== 503 || code !== "MAINTENANCE_MODE") return;
  if (window.location.pathname.startsWith("/admin/maintenance")) return;
  // Bounce even on the login endpoint itself — non-super-admin users
  // shouldn't make it past the login form during a freeze.
  window.location.replace("/admin/maintenance");
}

function maybeBounceOnBlocked(endpoint: string, code: string, message: string) {
  if (typeof window === "undefined") return;
  if (code !== "ACCOUNT_SUSPENDED" && code !== "ACCOUNT_DEACTIVATED") return;
  if (endpoint.startsWith("/api/auth/login")) return;
  if (window.location.pathname.startsWith("/admin/account-suspended")) return;

  // Lift email + role from the access JWT BEFORE we wipe it — the lockout
  // page uses email to pre-fill the form, and role to decide whether to show
  // the platform-team contact form (admin) or just the tenant-admin contact
  // card (faculty / student / placement / research).
  const { email, role } = decodeJwtFields(localStorage.getItem("glimmora_access_token"));

  localStorage.removeItem("glimmora_access_token");
  localStorage.removeItem("glimmora_refresh_token");

  const reason = encodeURIComponent(message);
  const variant = code === "ACCOUNT_DEACTIVATED" ? "deactivated" : "suspended";
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
  const roleParam = role ? `&role=${encodeURIComponent(role)}` : "";
  // replace, not push — back-button shouldn't re-enter the portal
  window.location.replace(
    `/admin/account-suspended?reason=${reason}&variant=${variant}${emailParam}${roleParam}`,
  );
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
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

  const json = await response.json();

  if (!response.ok) {
    const errorBody = json as ApiErrorResponse;
    const code = errorBody.error?.code || "UNKNOWN_ERROR";
    const message = errorBody.error?.message || "An unexpected error occurred";
    maybeBounceOnMaintenance(response.status, code);
    maybeBounceOnBlocked(endpoint, code, message);
    if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login") && !endpoint.startsWith("/api/auth/login")) {
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
      window.location.assign("/admin/login?reason=session_expired");
      return new Promise(() => {}) as never;
    }
    throw new ApiError(
      message,
      code,
      response.status,
      errorBody.error?.details,
      (errorBody.error as unknown as Record<string, unknown>) ?? undefined,
    );
  }

  return json as ApiResponse<T>;
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

  put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { method: "DELETE" });
  },
};
