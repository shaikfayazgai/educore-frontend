"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/superadmin/lib/api/client";
import type {
  ResearchDashboard,
  ResearchGrant,
  MyGrant,
  Collaborator,
  CollaborationGraph,
  ResearchPublication,
  TopicAnalytics,
  ResearchPerformance,
  ResearchProfile,
} from "@/superadmin/lib/api/types/research.types";
import type { PaginationMeta } from "@/superadmin/lib/api/types/common.types";

export function useResearchDashboard() {
  return useQuery({
    queryKey: ["research", "dashboard"],
    queryFn: () => api.get<ResearchDashboard>("/api/research/me/dashboard"),
    select: (res) => res.data,
  });
}

export function useGrantDiscovery(params?: { status?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["research", "grants", "discover", params],
    queryFn: () => api.get<ResearchGrant[]>(`/api/research/grants/discover${qs ? `?${qs}` : ""}`),
    select: (res) => ({ grants: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useGrantDetail(grantId: string) {
  return useQuery({
    queryKey: ["research", "grant", grantId],
    queryFn: () => api.get<ResearchGrant>(`/api/research/grants/${grantId}`),
    select: (res) => res.data,
    enabled: !!grantId,
  });
}

export function useMyGrants() {
  return useQuery({
    queryKey: ["research", "my-grants"],
    queryFn: () => api.get<MyGrant[]>("/api/research/me/grants"),
    select: (res) => res.data,
  });
}

export function useUpdateMyGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/research/me/grants/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["research", "my-grants"] });
      qc.invalidateQueries({ queryKey: ["research", "dashboard"] });
    },
  });
}

export function useCollaborators(params?: { search?: string }) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["research", "collaborations", params],
    queryFn: () => api.get<Collaborator[]>(`/api/research/me/collaborations${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

export function useCollaborationGraph() {
  return useQuery({
    queryKey: ["research", "collaborations", "graph"],
    queryFn: () => api.get<CollaborationGraph>("/api/research/me/collaborations/graph"),
    select: (res) => res.data,
  });
}

export function useResearchPublications(params?: { type?: string; search?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.type) sp.set("type", params.type);
  if (params?.search) sp.set("search", params.search);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["research", "publications", params],
    queryFn: () => api.get<ResearchPublication[]>(`/api/research/me/publications${qs ? `?${qs}` : ""}`),
    select: (res) => ({ publications: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useTopicTrends() {
  return useQuery({
    queryKey: ["research", "topics"],
    queryFn: () => api.get<TopicAnalytics>("/api/research/topics/trends"),
    select: (res) => res.data,
  });
}

export function useResearchPerformance() {
  return useQuery({
    queryKey: ["research", "performance"],
    queryFn: () => api.get<ResearchPerformance>("/api/research/me/performance"),
    select: (res) => res.data,
  });
}

export function useResearchProfile() {
  return useQuery({
    queryKey: ["research", "profile"],
    queryFn: () => api.get<ResearchProfile>("/api/research/me/profile"),
    select: (res) => res.data,
  });
}

export function useUpdateResearchProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ResearchProfile>) =>
      api.patch<ResearchProfile>("/api/research/me/profile", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["research", "profile"] });
    },
  });
}
