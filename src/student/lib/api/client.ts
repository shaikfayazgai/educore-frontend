import type { ApiResponse, ApiErrorResponse, SupportContact } from "./types/common.types";

const BASE_URL = process.env.NEXT_PUBLIC_STUDENT_API_BASE_URL || "";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, string[]>;
  setupUrl?: string;
  email?: string;
  lockoutToken?: string;
  supportContact?: SupportContact;

  constructor(body: ApiErrorResponse, status: number) {
    super(body.error?.message || "An unexpected error occurred");
    this.name = "ApiError";
    this.code = body.error?.code || "UNKNOWN_ERROR";
    this.status = status;
    this.details = body.error?.details;
    this.setupUrl = body.error?.setupUrl;
    this.email = body.error?.email;
    this.lockoutToken = body.error?.lockoutToken;
    this.supportContact = body.error?.supportContact;
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("glimmora_access_token");
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
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const body = json as ApiErrorResponse;
    const status = response.status;
    if (status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/student/login")) {
      localStorage.removeItem("glimmora_access_token");
      localStorage.removeItem("glimmora_refresh_token");
      window.location.assign("/student/login?reason=session_expired");
      return new Promise(() => {}) as never;
    }
    throw new ApiError(body, status);
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
