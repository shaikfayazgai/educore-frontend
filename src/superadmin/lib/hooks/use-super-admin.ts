"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/superadmin/lib/api/client";
import { getStoredAccessToken } from "@/superadmin/lib/auth/token-storage";
import type {
  SuperAdminDashboard,
  University,
  TrashedUniversity,
  CreateUniversityRequest,
  PlatformMonitoring,
  PlatformAuditEntry,
  PlatformSettings,
  WebhookTestResult,
  EmailTemplate,
  UpdateEmailTemplateRequest,
  SecurityFeaturesSummary,
  SecuritySessionsSummary,
  SingleActiveSessionRequest,
  LockedLoginAccount,
  BlockedIpEntry,
  BlockIpRequest,
  UnblockIpResponse,
  TenantComplaint,
  ComplaintCounts,
  ComplaintStatus,
} from "@/superadmin/lib/api/types/super-admin.types";
import type { ApiResponse } from "@/superadmin/lib/api/types/common.types";

/** Normalize API rows (camelCase or snake_case) so `universityCode` always displays and PATCH round-trips. */
function normalizeUniversity<T extends University>(raw: unknown): T {
  const r = raw as Record<string, unknown>;
  const codeRaw =
    (typeof r.universityCode === "string" ? r.universityCode : null) ??
    (typeof r.university_code === "string" ? r.university_code : null);
  return {
    ...(raw as T),
    universityCode: String(codeRaw ?? "").trim(),
  };
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ["super-admin", "dashboard"],
    queryFn: () => api.get<SuperAdminDashboard>("/api/super-admin/dashboard"),
    select: (res) => res.data,
  });
}

// ── Universities ──────────────────────────────────────────────────────────
export function useSuperAdminUniversities(params?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["super-admin", "universities", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
      const qs = searchParams.toString();
      return api.get<University[]>(
        `/api/super-admin/universities${qs ? `?${qs}` : ""}`
      );
    },
    select: (res: ApiResponse<University[]>) => ({
      ...res,
      data: (res.data ?? []).map((u) => normalizeUniversity(u)),
    }),
  });
}

export function useSuperAdminUniversityDetail(id: string) {
  return useQuery({
    queryKey: ["super-admin", "university", id],
    queryFn: () => api.get<University>(`/api/super-admin/universities/${id}`),
    select: (res) => normalizeUniversity(res.data),
    // "trash" was a legacy path segment; real tenant ids are UUIDs (or mock ids).
    enabled: !!id && id !== "trash",
  });
}

export function useCreateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUniversityRequest) =>
      api.post<University>("/api/super-admin/universities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
    },
  });
}

export function useUpdateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<University>) =>
      api.patch<University>(`/api/super-admin/universities/${id}`, data),
    onSuccess: (_, variables) => {
      // Suspending also moves the row to Trash on the server, and the
      // bell + monitoring counts both depend on tenant state. Invalidate
      // every dependent query so the UI catches up in one round-trip.
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities-trash"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "university", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "monitoring"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "notifications"] });
    },
  });
}

export function useSuperAdminTrashUniversities(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["super-admin", "universities-trash", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
      const qs = searchParams.toString();
      return api.get<TrashedUniversity[]>(
        `/api/super-admin/trash/universities${qs ? `?${qs}` : ""}`
      );
    },
    select: (res: ApiResponse<TrashedUniversity[]>) => ({
      ...res,
      data: (res.data ?? []).map((u) => normalizeUniversity<TrashedUniversity>(u)),
    }),
  });
}

export function useMoveUniversityToTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<TrashedUniversity>(`/api/super-admin/universities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities-trash"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "university"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "monitoring"] });
    },
  });
}

export function useRestoreUniversityFromTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<University>(`/api/super-admin/universities/${id}/restore`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities-trash"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "university", id] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "monitoring"] });
    },
  });
}

export function usePermanentDeleteUniversityFromTrash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ deleted: boolean; id: string }>(
        `/api/super-admin/trash/universities/${id}/permanent`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities-trash"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "monitoring"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

/**
 * Extend (or shorten) the permanent_delete_at date for a trashed tenant.
 * Body: { permanentDeleteAt: ISO string } or { extendDays: number }.
 */
export function useExtendTrashedUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, ...body
    }: { id: string; permanentDeleteAt?: string; extendDays?: number }) =>
      api.post<TrashedUniversity>(
        `/api/super-admin/trash/universities/${id}/extend`,
        body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities-trash"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

export function useSendUniversityInviteOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ sent: boolean; expiresInMinutes: number; emailSent?: boolean }>(
        `/api/super-admin/universities/${id}/invite-otp`
      ),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "university", id] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

export function useVerifyUniversityInviteOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) =>
      api.post<University>(`/api/super-admin/universities/${id}/verify-invite-otp`, { otp }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "university", id] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

// ── Monitoring ───────────────────────────────────────────────────────────
export function usePlatformMonitoring() {
  return useQuery({
    queryKey: ["super-admin", "monitoring"],
    queryFn: () => api.get<PlatformMonitoring>("/api/super-admin/monitoring"),
    select: (res) => res.data,
    refetchInterval: 30000,
  });
}

// ── Audit Log ────────────────────────────────────────────────────────────
export function usePlatformAuditLog(params?: {
  search?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["super-admin", "audit-log", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.action) searchParams.set("action", params.action);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
      const qs = searchParams.toString();
      return api.get<PlatformAuditEntry[]>(
        `/api/super-admin/audit-log${qs ? `?${qs}` : ""}`
      );
    },
  });
}

export type ImportRowStatus = "ok" | "created" | "error";

export type ImportRowErrorCode =
  | "DUPLICATE_EMAIL"
  | "DUPLICATE_CODE"
  | "MISSING_FIELDS"
  | "INVALID_CODE"
  | "INVALID_EMAIL"
  | "VALIDATION_ERROR"
  | "DB_ERROR";

export interface ImportRowResult {
  row: number;
  status: ImportRowStatus;
  errorCode?: ImportRowErrorCode;
  error?: string;
  data: Record<string, string>;
}

export interface ImportUniversitiesResult {
  dryRun: boolean;
  created: number;
  failed: number;
  wouldCreate: number | null;
  errors: { row: number; error: string; data: Record<string, string> }[];
  createdRows: University[];
  rowResults: ImportRowResult[];
}

/**
 * Bulk import universities from a CSV or XLSX file. Bypasses the JSON ApiClient
 * because we need multipart/form-data; reuses the same Bearer auth.
 *
 * Pass `dryRun: true` to validate only — no rows are inserted, but rowResults
 * tell you exactly what would happen. Use this for a preview UI.
 */
export function useImportUniversities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, dryRun = false }: { file: File; dryRun?: boolean }): Promise<{ data: ImportUniversitiesResult }> => {
      const baseUrl = process.env.NEXT_PUBLIC_SUPERADMIN_API_BASE_URL || "";
      const token = getStoredAccessToken();
      const fd = new FormData();
      fd.append("file", file);
      const url = `${baseUrl}/api/super-admin/universities/import${dryRun ? "?dryRun=true" : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const text = await res.text();
      let json: unknown = {};
      try { json = text ? JSON.parse(text) : {}; } catch { /* keep as text */ }
      if (!res.ok) {
        const err = (json as { error?: { message?: string; code?: string } }).error;
        throw new Error(err?.message || `Import failed (${res.status})`);
      }
      return json as { data: ImportUniversitiesResult };
    },
    onSuccess: (res) => {
      // Only invalidate caches for actual commits, not dry-runs.
      if (!res.data.dryRun) {
        queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
        queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
      }
    },
  });
}

export function useDeleteAuditEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ deleted: number }>(`/api/super-admin/audit-log/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

export function useBulkDeleteAuditLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lastDays: number) =>
      api.delete<{ deleted: number; lastDays: number }>(
        `/api/super-admin/audit-log/bulk?lastDays=${lastDays}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

/**
 * Triggers an audit-log download in the browser. Bypasses the JSON ApiClient
 * because the response is a binary file (csv or xlsx).
 */
export async function downloadAuditLog(
  format: "csv" | "xlsx",
  params?: { search?: string; action?: string }
) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPERADMIN_API_BASE_URL || "";
  const token = getStoredAccessToken();
  const qs = new URLSearchParams();
  qs.set("format", format);
  if (params?.search) qs.set("search", params.search);
  if (params?.action) qs.set("action", params.action);
  const url = `${baseUrl}/api/super-admin/audit-log/export?${qs.toString()}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  const cd = res.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename="?([^";]+)"?/i);
  a.download =
    match?.[1] || `audit-log-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/** Backwards-compat alias for the previous CSV-only helper. */
export const downloadAuditLogCsv = (params?: { search?: string; action?: string }) =>
  downloadAuditLog("csv", params);

// ── Settings ─────────────────────────────────────────────────────────────
export function usePlatformSettings() {
  return useQuery({
    queryKey: ["super-admin", "settings"],
    queryFn: () => api.get<PlatformSettings>("/api/super-admin/settings"),
    select: (res) => res.data,
  });
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlatformSettings>) =>
      api.patch<PlatformSettings>("/api/super-admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "settings"] });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (url: string) =>
      api.post<WebhookTestResult>("/api/super-admin/settings/test-webhook", { url }),
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["super-admin", "email-templates"],
    queryFn: () => api.get<EmailTemplate[]>("/api/super-admin/email-templates"),
    select: (res) => res.data,
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, ...body }: UpdateEmailTemplateRequest) =>
      api.patch<EmailTemplate>(`/api/super-admin/email-templates/${key}`, body),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "email-template", key] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

export function useResetEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) =>
      api.post<EmailTemplate>(`/api/super-admin/email-templates/${key}/reset`),
    onSuccess: (_, key) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "email-template", key] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

export function useSecurityFeatures() {
  return useQuery({
    queryKey: ["super-admin", "security", "features"],
    queryFn: () =>
      api.get<SecurityFeaturesSummary>("/api/super-admin/security/rate-limits"),
    select: (res) => res.data,
    refetchInterval: 15000,
  });
}

export function useBlockedIps(limit = 100) {
  return useQuery({
    queryKey: ["super-admin", "security", "blocked-ips", limit],
    queryFn: () =>
      api.get<BlockedIpEntry[]>(`/api/super-admin/security/blocked-ips?limit=${limit}`),
    select: (res) => res.data,
    refetchInterval: 15000,
  });
}

export function useSecuritySessions() {
  return useQuery({
    queryKey: ["super-admin", "security", "sessions"],
    queryFn: () =>
      api.get<SecuritySessionsSummary>("/api/super-admin/security/sessions/current"),
    select: (res) => res.data,
    refetchInterval: 30000,
  });
}

export function useUpdateSingleActiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SingleActiveSessionRequest) =>
      api.patch<SecuritySessionsSummary>("/api/super-admin/security/sessions/single-active", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "security", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "security", "features"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

export function useLockedLoginAccounts() {
  return useQuery({
    queryKey: ["super-admin", "security", "locked-accounts"],
    queryFn: () =>
      api.get<LockedLoginAccount[]>("/api/super-admin/security/locked-accounts"),
    select: (res) => res.data,
    refetchInterval: 15000,
  });
}

export function useBlockIp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BlockIpRequest) =>
      api.post<BlockedIpEntry>("/api/super-admin/security/blocked-ips", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "security", "blocked-ips"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "security", "features"] });
    },
  });
}

export function useUnblockIp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ip: string) =>
      api.delete<UnblockIpResponse>(
        `/api/super-admin/security/blocked-ips?ip=${encodeURIComponent(ip)}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "security", "blocked-ips"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "security", "features"] });
    },
  });
}

export function useUnlockLoginAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.post<{ success: boolean; id: string; email: string; role: string }>(
        `/api/super-admin/security/accounts/unlock?email=${encodeURIComponent(email)}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "security", "locked-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "audit-log"] });
    },
  });
}

// ── Complaints (tenant lockout-page submissions) ──────────────────────────
export function useComplaints(params?: {
  status?: string;
  issueType?: string;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status_filter", params.status);
  if (params?.issueType) search.set("issue_type", params.issueType);
  const qs = search.toString();
  return useQuery({
    queryKey: ["super-admin", "complaints", params ?? {}],
    queryFn: () =>
      api.get<TenantComplaint[]>(`/api/super-admin/complaints${qs ? `?${qs}` : ""}`),
    select: (res) => ({
      items: res.data,
      counts: (res.meta as { counts?: ComplaintCounts } | undefined)?.counts,
    }),
    refetchInterval: 60_000,
  });
}

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: ComplaintStatus;
      resolutionNote?: string | null;
    }) =>
      api.patch<TenantComplaint>(`/api/super-admin/complaints/${input.id}`, {
        status: input.status,
        resolutionNote: input.resolutionNote ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin", "complaints"] });
      qc.invalidateQueries({ queryKey: ["super-admin", "notifications"] });
    },
  });
}

export function useMarkComplaintsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/api/super-admin/complaints/mark-seen`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin", "notifications"] });
    },
  });
}
