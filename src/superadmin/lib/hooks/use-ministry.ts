"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/superadmin/lib/api/client";
import type {
  MinistryDashboard,
  InstitutionSummary,
  InstitutionDetail,
  MinistryCompliance,
  SimulationConfig,
  SimulationResult,
  ScenarioComparison,
  MinistryReport,
  QualityIndicator,
  MinistryBudget,
  MinistrySettings,
} from "@/superadmin/lib/api/types/ministry.types";
import type { PaginationMeta } from "@/superadmin/lib/api/types/common.types";

export function useMinistryDashboard() {
  return useQuery({
    queryKey: ["ministry", "dashboard"],
    queryFn: () => api.get<MinistryDashboard>("/api/ministry/dashboard"),
    select: (res) => res.data,
  });
}

export function useInstitutions(params?: {
  search?: string;
  region?: string;
  type?: string;
  complianceStatus?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.region) sp.set("region", params.region);
  if (params?.type) sp.set("type", params.type);
  if (params?.complianceStatus) sp.set("complianceStatus", params.complianceStatus);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["ministry", "institutions", params],
    queryFn: () => api.get<InstitutionSummary[]>(`/api/ministry/institutions${qs ? `?${qs}` : ""}`),
    select: (res) => ({ institutions: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useInstitutionDetail(institutionId: string) {
  return useQuery({
    queryKey: ["ministry", "institution", institutionId],
    queryFn: () => api.get<InstitutionDetail>(`/api/ministry/institutions/${institutionId}`),
    select: (res) => res.data,
    enabled: !!institutionId,
  });
}

export function useMinistryCompliance() {
  return useQuery({
    queryKey: ["ministry", "compliance"],
    queryFn: () => api.get<MinistryCompliance>("/api/ministry/compliance"),
    select: (res) => res.data,
  });
}

export function useSimulationResults() {
  return useQuery({
    queryKey: ["ministry", "simulations"],
    queryFn: () => api.get<SimulationResult[]>("/api/ministry/simulation/results"),
    select: (res) => res.data,
  });
}

export function useRunSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: SimulationConfig) =>
      api.post<SimulationResult>("/api/ministry/simulation/run", config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ministry", "simulations"] });
    },
  });
}

export function useScenarioComparison(ids: string[]) {
  return useQuery({
    queryKey: ["ministry", "scenarios", "compare", ids],
    queryFn: () =>
      api.get<ScenarioComparison>(`/api/ministry/scenarios/compare?ids=${ids.join(",")}`),
    select: (res) => res.data,
    enabled: ids.length >= 2,
  });
}

export function useMinistryReports(params?: { type?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set("type", params.type);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["ministry", "reports", params],
    queryFn: () => api.get<MinistryReport[]>(`/api/ministry/reports${qs ? `?${qs}` : ""}`),
    select: (res) => ({ reports: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useGenerateMinistryReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; type: string; parameters: Record<string, string> }) =>
      api.post<MinistryReport>("/api/ministry/reports/generate", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ministry", "reports"] });
    },
  });
}

export function useQualityIndicators(params?: { region?: string; sort?: string }) {
  const sp = new URLSearchParams();
  if (params?.region) sp.set("region", params.region);
  if (params?.sort) sp.set("sort", params.sort);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["ministry", "quality", params],
    queryFn: () => api.get<QualityIndicator[]>(`/api/ministry/quality-indicators${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

export function useMinistryBudget() {
  return useQuery({
    queryKey: ["ministry", "budget"],
    queryFn: () => api.get<MinistryBudget>("/api/ministry/budget"),
    select: (res) => res.data,
  });
}

export function useMinistrySettings() {
  return useQuery({
    queryKey: ["ministry", "settings"],
    queryFn: () => api.get<MinistrySettings>("/api/ministry/settings"),
    select: (res) => res.data,
  });
}

export function useUpdateMinistrySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MinistrySettings>) =>
      api.patch<MinistrySettings>("/api/ministry/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ministry", "settings"] });
    },
  });
}
