"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/superadmin/lib/api/client";
import type {
  AdminDashboard,
  InstitutionalAnalytics,
  CompliancePulse,
  ComplianceDeviation,
  AuditLogEntry,
  AdminUser,
  CreateUserRequest,
  RoleDefinition,
  Integration,
  BudgetOverview,
  AiModel,
  BiasReport,
  AiOverrideLog,
  AdminCredential,
  IssueCredentialRequest,
  ReportTemplate,
  GeneratedReport,
  InstitutionSettings,
} from "@/superadmin/lib/api/types/admin.types";
import type { PaginationMeta } from "@/superadmin/lib/api/types/common.types";

// === Dashboard ===
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.get<AdminDashboard>("/api/admin/dashboard"),
    select: (res) => res.data,
  });
}

// === Analytics ===
export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => api.get<InstitutionalAnalytics>("/api/admin/analytics"),
    select: (res) => res.data,
  });
}

// === Compliance ===
export function useCompliancePulse() {
  return useQuery({
    queryKey: ["admin", "compliance", "pulse"],
    queryFn: () => api.get<CompliancePulse>("/api/admin/compliance/pulse"),
    select: (res) => res.data,
  });
}

export function useComplianceDeviations(params?: { status?: string; severity?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.severity) sp.set("severity", params.severity);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "compliance", "deviations", params],
    queryFn: () => api.get<ComplianceDeviation[]>(`/api/admin/compliance/deviations${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

export function useResolveDeviation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      api.patch(`/api/admin/compliance/deviations/${id}`, { resolution }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "compliance"] });
    },
  });
}

// === Audit Trail ===
export function useAuditTrail(params?: {
  search?: string;
  action?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.action) sp.set("action", params.action);
  if (params?.role) sp.set("role", params.role);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "audit-trail", params],
    queryFn: () => api.get<AuditLogEntry[]>(`/api/admin/compliance/audit-trail${qs ? `?${qs}` : ""}`),
    select: (res) => ({ entries: res.data, meta: res.meta as PaginationMeta }),
  });
}

// === Users ===
export function useAdminUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.role) sp.set("role", params.role);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => api.get<AdminUser[]>(`/api/admin/users${qs ? `?${qs}` : ""}`),
    select: (res) => ({ users: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => api.get<AdminUser>(`/api/admin/users/${userId}`),
    select: (res) => res.data,
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => api.post<AdminUser>("/api/admin/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AdminUser>) =>
      api.patch<AdminUser>(`/api/admin/users/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "user", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// === Roles ===
export function useRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => api.get<RoleDefinition[]>("/api/admin/roles"),
    select: (res) => res.data,
  });
}

export function useTogglePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ role, module, action }: { role: string; module: string; action: string }) =>
      api.patch(`/api/admin/roles/${role}/permissions`, { module, action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
  });
}

// === Integrations ===
export function useIntegrations() {
  return useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: () => api.get<Integration[]>("/api/admin/integrations"),
    select: (res) => res.data,
  });
}

// === Budget ===
export function useBudgetOverview() {
  return useQuery({
    queryKey: ["admin", "budget"],
    queryFn: () => api.get<BudgetOverview>("/api/admin/budget"),
    select: (res) => res.data,
  });
}

// === AI Governance ===
export function useAiGovernanceOverview() {
  return useQuery({
    queryKey: ["admin", "ai-governance", "overview"],
    queryFn: () =>
      api.get<{ totalModels: number; activeModels: number; avgAccuracy: number; avgBias: number; recentOverrides: number }>(
        "/api/admin/ai-governance/overview"
      ),
    select: (res) => res.data,
  });
}

export function useAiModels() {
  return useQuery({
    queryKey: ["admin", "ai-governance", "models"],
    queryFn: () => api.get<AiModel[]>("/api/admin/ai-governance/models"),
    select: (res) => res.data,
  });
}

export function useAiModelDetail(modelId: string) {
  return useQuery({
    queryKey: ["admin", "ai-governance", "model", modelId],
    queryFn: () => api.get<AiModel>(`/api/admin/ai-governance/models/${modelId}`),
    select: (res) => res.data,
    enabled: !!modelId,
  });
}

export function useBiasReports() {
  return useQuery({
    queryKey: ["admin", "ai-governance", "bias-reports"],
    queryFn: () => api.get<BiasReport[]>("/api/admin/ai-governance/bias-reports"),
    select: (res) => res.data,
  });
}

export function useBiasReportDetail(reportId: string) {
  return useQuery({
    queryKey: ["admin", "ai-governance", "bias-report", reportId],
    queryFn: () => api.get<BiasReport>(`/api/admin/ai-governance/bias-reports/${reportId}`),
    select: (res) => res.data,
    enabled: !!reportId,
  });
}

export function useOverrideLog(params?: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "ai-governance", "overrides", params],
    queryFn: () => api.get<AiOverrideLog[]>(`/api/admin/ai-governance/overrides${qs ? `?${qs}` : ""}`),
    select: (res) => ({ overrides: res.data, meta: res.meta as PaginationMeta }),
  });
}

// === Credentials ===
export function useAdminCredentials(params?: {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.type) sp.set("type", params.type);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "credentials", params],
    queryFn: () => api.get<AdminCredential[]>(`/api/admin/credentials${qs ? `?${qs}` : ""}`),
    select: (res) => ({ credentials: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useIssueCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IssueCredentialRequest) =>
      api.post<AdminCredential>("/api/admin/credentials", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "credentials"] });
    },
  });
}

export function useRevokeCredential() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/admin/credentials/${id}/revoke`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "credentials"] });
    },
  });
}

// === Reports ===
export function useReportTemplates() {
  return useQuery({
    queryKey: ["admin", "reports", "templates"],
    queryFn: () => api.get<ReportTemplate[]>("/api/admin/reports/templates"),
    select: (res) => res.data,
  });
}

export function useGeneratedReports(params?: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "reports", "generated", params],
    queryFn: () => api.get<GeneratedReport[]>(`/api/admin/reports/generated${qs ? `?${qs}` : ""}`),
    select: (res) => ({ reports: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { templateId: string; parameters: Record<string, string> }) =>
      api.post<GeneratedReport>("/api/admin/reports/generate", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports", "generated"] });
    },
  });
}

// === Settings ===
export function useInstitutionSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<InstitutionSettings>("/api/admin/settings"),
    select: (res) => res.data,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InstitutionSettings>) =>
      api.patch<InstitutionSettings>("/api/admin/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}
