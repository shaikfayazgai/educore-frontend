"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/superadmin/lib/api/client";
import type {
  AdmissionsDashboard,
  AdmissionApplication,
  AdmissionPredictions,
} from "@/superadmin/lib/api/types/admissions.types";
import type { PaginationMeta } from "@/superadmin/lib/api/types/common.types";

export function useAdmissionsDashboard() {
  return useQuery({
    queryKey: ["admissions", "dashboard"],
    queryFn: () => api.get<AdmissionsDashboard>("/api/admin/admissions/dashboard"),
    select: (res) => res.data,
  });
}

export function useAdmissionApplications(params?: {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  if (params?.department) sp.set("department", params.department);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admissions", "applications", params],
    queryFn: () =>
      api.get<AdmissionApplication[]>(`/api/admin/admissions/applications${qs ? `?${qs}` : ""}`),
    select: (res) => ({ applications: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useApplicationDetail(applicationId: string) {
  return useQuery({
    queryKey: ["admissions", "application", applicationId],
    queryFn: () =>
      api.get<AdmissionApplication>(`/api/admin/admissions/applications/${applicationId}`),
    select: (res) => res.data,
    enabled: !!applicationId,
  });
}

export function useReviewApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, outcome, reason }: { applicationId: string; outcome: string; reason?: string }) =>
      api.post(`/api/admin/admissions/applications/${applicationId}/review`, { outcome, reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admissions", "application", vars.applicationId] });
      qc.invalidateQueries({ queryKey: ["admissions", "applications"] });
      qc.invalidateQueries({ queryKey: ["admissions", "dashboard"] });
    },
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, ...data }: { applicationId: string; date: string; time: string; interviewerName: string }) =>
      api.post(`/api/admin/admissions/applications/${applicationId}/schedule-interview`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admissions", "application", vars.applicationId] });
      qc.invalidateQueries({ queryKey: ["admissions", "applications"] });
    },
  });
}

export function useAddReviewNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, ...data }: { applicationId: string; content: string; type: string }) =>
      api.post(`/api/admin/admissions/applications/${applicationId}/notes`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admissions", "application", vars.applicationId] });
    },
  });
}

export function useAdmissionPredictions() {
  return useQuery({
    queryKey: ["admissions", "predictions"],
    queryFn: () => api.get<AdmissionPredictions>("/api/admin/admissions/predictions"),
    select: (res) => res.data,
  });
}

export function useImplementRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/admissions/predictions/recommendations/${id}/implement`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions", "predictions"] });
    },
  });
}

export function useDismissRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/admin/admissions/predictions/recommendations/${id}/dismiss`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions", "predictions"] });
    },
  });
}
