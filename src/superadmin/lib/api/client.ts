import type { ApiResponse } from "./types/common.types";
import { clearStoredAuth, getStoredAccessToken } from "@/superadmin/lib/auth/token-storage";

const BASE_URL = process.env.NEXT_PUBLIC_SUPERADMIN_API_BASE_URL || "";
const API_TARGET = BASE_URL || "the configured API origin";

/** Map FastAPI / MSW / empty bodies to a message the UI can show (avoids generic "unexpected"). */
function parseApiErrorPayload(
  json: unknown,
  statusText: string
): { message: string; code: string; details?: Record<string, string[]> } {
  if (json && typeof json === "object") {
    const j = json as Record<string, unknown>;
    const err = j.error;
    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      if (typeof e.message === "string" && e.message.trim()) {
        return {
          message: e.message,
          code: typeof e.code === "string" ? e.code : "UNKNOWN_ERROR",
          details: e.details as Record<string, string[]> | undefined,
        };
      }
    }
    const detail = j.detail;
    if (typeof detail === "string" && detail.trim()) {
      return { message: detail, code: "HTTP_ERROR" };
    }
    if (Array.isArray(detail)) {
      const msgs = detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return "";
        })
        .filter(Boolean);
      if (msgs.length) {
        return { message: msgs.join("; "), code: "VALIDATION_ERROR" };
      }
    }
  }
  const fallback =
    (statusText && statusText !== "Unknown Error" && statusText.trim()) ||
    "Request failed. Check the API response or server logs.";
  return { message: fallback, code: "UNKNOWN_ERROR" };
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

export function getAuthToken(): string | null {
  return getStoredAccessToken();
}

/** Public event name fired right before we navigate to /login after a
 *  401. The QueryProvider listens for this and mounts a fullscreen
 *  "signing you out…" overlay so the page doesn't render an
 *  alarming ErrorState ("Failed to fetch") for the tick between the
 *  401 hitting and the browser actually unloading. */
export const AUTH_EXPIRED_EVENT = "glimmora:auth-expired";

function clearStoredAuthAndRedirect(endpoint: string) {
  if (typeof window === "undefined") return;
  if (endpoint === "/api/auth/login") return;
  clearStoredAuth();
  // Tell every listening provider we're about to bounce — the overlay
  // pops first, then the navigation kicks in. Idempotent: re-dispatch
  // on every 401 doesn't matter because the overlay is a singleton.
  try {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  } catch { /* no-op — older browsers without CustomEvent ctor */ }
  const reason = "auth-expired";
  if (!window.location.pathname.includes("/superadmin/login")) {
    window.location.assign(`/superadmin/login?reason=${reason}`);
  }
}

/** Download JSON export for a university in trash (GET returns attachment, not JSON envelope). */
export async function downloadTrashedUniversityExport(universityId: string): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(
    `${BASE_URL}/api/super-admin/universities/${universityId}/export`,
    { method: "GET", headers }
  );
  const text = await response.text();
  if (!response.ok) {
    try {
      const err = JSON.parse(text) as { error?: { message?: string } };
      throw new Error(err.error?.message || "Export failed");
    } catch {
      throw new Error(response.status === 404 ? "Export not available" : "Export failed");
    }
  }
  const disposition = response.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `university-${universityId}.json`;
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (e) {
    if (e instanceof TypeError) {
      throw new ApiError(
        `Cannot reach the API at ${API_TARGET}. Start the matching backend, set NEXT_PUBLIC_SUPERADMIN_API_BASE_URL in .env.local, and restart next dev.`,
        "NETWORK_ERROR",
        0
      );
    }
    const message = "Network request failed.";
    throw new ApiError(message, "NETWORK_ERROR", 0);
  }

  const text = await response.text();
  let json: unknown = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (response.status === 404) {
        throw new ApiError(
          `API route was not found at ${API_TARGET}${endpoint}. Check NEXT_PUBLIC_SUPERADMIN_API_BASE_URL and restart the dev server.`,
          "INVALID_RESPONSE",
          response.status
        );
      }
      throw new ApiError(
        "The server returned a non-JSON response.",
        "INVALID_RESPONSE",
        response.status
      );
    }
  }

  if (!response.ok) {
    const parsed = parseApiErrorPayload(json, response.statusText);
    // Any 401 from an authenticated endpoint → bounce. The previous
    // allowlist of error codes ("SESSION_INVALID", "UNAUTHORIZED")
    // missed cases where the backend returned 401 with no error code
    // (validation rejection, expired token from middleware, etc.) and
    // pages would render "Failed to fetch" instead of signing the
    // user out.
    if (response.status === 401) {
      clearStoredAuthAndRedirect(endpoint);
    }
    throw new ApiError(parsed.message, parsed.code, response.status, parsed.details);
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
