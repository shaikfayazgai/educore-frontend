"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/admin/lib/api/client";
import type {
  PlacementDashboard,
  PlacementStudent,
  Employer,
  MatchResult,
  MatchRunConfig,
  PipelineItem,
  PlacementReport,
  PlacementSettings,
} from "@/admin/lib/api/types/placement.types";
import type { PaginationMeta } from "@/admin/lib/api/types/common.types";

export function usePlacementDashboard() {
  return useQuery({
    queryKey: ["placement", "dashboard"],
    queryFn: () => api.get<PlacementDashboard>("/api/placement/dashboard"),
    select: (res) => res.data,
  });
}

export function usePlacementStudents(params?: {
  search?: string;
  department?: string;
  minScore?: number;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.department) sp.set("department", params.department);
  if (params?.minScore) sp.set("minScore", String(params.minScore));
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["placement", "students", params],
    queryFn: () => api.get<PlacementStudent[]>(`/api/placement/students${qs ? `?${qs}` : ""}`),
    select: (res) => ({ students: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function usePlacementEmployers(params?: {
  search?: string;
  industry?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.industry) sp.set("industry", params.industry);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["placement", "employers", params],
    queryFn: () => api.get<Employer[]>(`/api/placement/employers${qs ? `?${qs}` : ""}`),
    select: (res) => ({ employers: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useEmployerDetail(employerId: string) {
  return useQuery({
    queryKey: ["placement", "employer", employerId],
    queryFn: () => api.get<Employer>(`/api/placement/employers/${employerId}`),
    select: (res) => res.data,
    enabled: !!employerId,
  });
}

export function useCreateEmployer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Employer>) =>
      api.post<Employer>("/api/placement/employers", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement", "employers"] });
    },
  });
}

export function useRunMatching() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: MatchRunConfig) =>
      api.post<MatchResult[]>("/api/placement/matching/run", config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement", "matching"] });
      qc.invalidateQueries({ queryKey: ["placement", "dashboard"] });
    },
  });
}

export function useMatchResults(params?: { status?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["placement", "matching", "results", params],
    queryFn: () => api.get<MatchResult[]>(`/api/placement/matching/results${qs ? `?${qs}` : ""}`),
    select: (res) => ({ matches: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useApproveMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) =>
      api.post(`/api/placement/matching/${matchId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement", "matching"] });
      qc.invalidateQueries({ queryKey: ["placement", "pipeline"] });
    },
  });
}

export function useRejectMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) =>
      api.post(`/api/placement/matching/${matchId}/reject`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement", "matching"] });
    },
  });
}

export function usePipeline(params?: { stage?: string }) {
  const sp = new URLSearchParams();
  if (params?.stage) sp.set("stage", params.stage);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["placement", "pipeline", params],
    queryFn: () => api.get<PipelineItem[]>(`/api/placement/pipeline${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

export function useUpdatePipelineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; stage?: string; notes?: string }) =>
      api.patch(`/api/placement/pipeline/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement", "pipeline"] });
      qc.invalidateQueries({ queryKey: ["placement", "dashboard"] });
    },
  });
}

export function usePlacementReports() {
  return useQuery({
    queryKey: ["placement", "reports"],
    queryFn: () => api.get<PlacementReport>("/api/placement/reports"),
    select: (res) => res.data,
  });
}

export function usePlacementSettings() {
  return useQuery({
    queryKey: ["placement", "settings"],
    queryFn: () => api.get<PlacementSettings>("/api/placement/settings"),
    select: (res) => res.data,
  });
}

export function useUpdatePlacementSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementSettings>) =>
      api.patch<PlacementSettings>("/api/placement/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement", "settings"] });
    },
  });
}
