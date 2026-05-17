"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/admin/lib/api/client";
import type {
  SuperAdminDashboard,
  University,
  CreateUniversityRequest,
  PlatformMonitoring,
  PlatformAuditEntry,
  PlatformSettings,
} from "@/admin/lib/api/types/super-admin.types";


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
  });
}

export function useSuperAdminUniversityDetail(id: string) {
  return useQuery({
    queryKey: ["super-admin", "university", id],
    queryFn: () => api.get<University>(`/api/super-admin/universities/${id}`),
    select: (res) => res.data,
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: ["super-admin", "universities"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "university", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
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
