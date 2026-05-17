import type { ApiResponse, ApiErrorResponse } from "./types/common.types";

const PLACEMENT_BASE = process.env.NEXT_PUBLIC_PLACEMENT_API_BASE_URL || "";
const UNIBACKEND_BASE = process.env.NEXT_PUBLIC_UNIBACKEND_BASE_URL || "";

// Auth + setup-password live in UniBackend, not the placement service.
// Everything else routes to the placement service.
function pickBase(endpoint: string): string {
  if (
    endpoint.startsWith("/api/auth/") ||
    endpoint.startsWith("/api/setup-password/")
  ) {
    return UNIBACKEND_BASE || PLACEMENT_BASE;
  }
  return PLACEMENT_BASE;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("glimmora_access_token");
}

/**
 * Best-effort decode of the JWT's payload — lifts the user's email and role
 * off the access token BEFORE we wipe it on a mid-session bounce, so the
 * suspended page can pre-fill the contact form. Mirrors the admin client's
 * helper.
 */
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

/**
 * When any authenticated call returns 403 ACCOUNT_SUSPENDED / ACCOUNT_DEACTIVATED,
 * wipe local creds and bounce to /placement/account-suspended. Catches
 * mid-session bans — admin deactivates a placement officer while they're
 * actively working; the next API call returns 403; the bell stops; they
 * land on the suspended page.
 *
 * Skip on /api/auth/login because the auth-store handles that flow itself.
 */
function maybeBounceOnBlocked(endpoint: string, code: string, message: string) {
  if (typeof window === "undefined") return;
  if (code !== "ACCOUNT_SUSPENDED" && code !== "ACCOUNT_DEACTIVATED") return;
  if (endpoint.startsWith("/api/auth/login")) return;
  if (window.location.pathname.startsWith("/placement/account-suspended")) return;

  const { email, role } = decodeJwtFields(localStorage.getItem("glimmora_access_token"));

  localStorage.removeItem("glimmora_access_token");
  localStorage.removeItem("glimmora_refresh_token");

  const reason = encodeURIComponent(message);
  const variant = code === "ACCOUNT_DEACTIVATED" ? "deactivated" : "suspended";
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
  const roleParam = role ? `&role=${encodeURIComponent(role)}` : "";
  // replace, not push — back-button shouldn't re-enter the portal
  window.location.replace(
    `/placement/account-suspended?reason=${reason}&variant=${variant}${emailParam}${roleParam}`,
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

  const base = pickBase(endpoint);
  const response = await fetch(`${base}${endpoint}`, { ...options, headers });

  const text = await response.text();
  const json = text ? JSON.parse(text) : ({} as Record<string, unknown>);

  if (!response.ok) {
    const errorBody = json as ApiErrorResponse;
    const code = errorBody.error?.code || "UNKNOWN_ERROR";
    const message = errorBody.error?.message || "An unexpected error occurred";

    // 403 with suspended/deactivated code → bounce to suspended page
    maybeBounceOnBlocked(endpoint, code, message);

    if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/placement/login")) {
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
      window.location.assign("/placement/login?reason=session_expired");
      return new Promise(() => {}) as never;
    }
    throw new ApiError(message, code, response.status, errorBody.error?.details);
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

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiClient<T>(endpoint, { method: "DELETE" });
  },
};
