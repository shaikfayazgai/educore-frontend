"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/superadmin/lib/api/client";
import type {
  FacultyDashboard,
  FacultyStudentListItem,
  FacultyStudentDetail,
  Intervention,
  CreateInterventionRequest,
  FacultyCourse,
  FacultyCourseDetail,
  FacultyGrant,
  FacultyCollaboration,
  FacultyPublication,
  AiBriefing,
  FacultyProfile,
  FacultyNotificationPreferences,
} from "@/superadmin/lib/api/types/faculty.types";
import type { PaginationMeta } from "@/superadmin/lib/api/types/common.types";

// === Dashboard ===
export function useFacultyDashboard() {
  return useQuery({
    queryKey: ["faculty", "dashboard"],
    queryFn: () => api.get<FacultyDashboard>("/api/faculty/me/dashboard"),
    select: (res) => res.data,
  });
}

// === Students ===
export function useFacultyStudents(params?: {
  search?: string;
  riskLevel?: string;
  page?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.riskLevel) searchParams.set("riskLevel", params.riskLevel);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["faculty", "students", params],
    queryFn: () =>
      api.get<FacultyStudentListItem[]>(
        `/api/faculty/me/students${qs ? `?${qs}` : ""}`
      ),
    select: (res) => ({
      students: res.data,
      meta: res.meta as PaginationMeta,
    }),
  });
}

export function useFacultyStudentDetail(studentId: string) {
  return useQuery({
    queryKey: ["faculty", "student", studentId],
    queryFn: () =>
      api.get<FacultyStudentDetail>(`/api/faculty/me/students/${studentId}`),
    select: (res) => res.data,
    enabled: !!studentId,
  });
}

// === Interventions ===
export function useInterventions(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["faculty", "interventions", params],
    queryFn: () =>
      api.get<Intervention[]>(
        `/api/faculty/me/interventions${qs ? `?${qs}` : ""}`
      ),
    select: (res) => ({
      interventions: res.data,
      meta: res.meta as PaginationMeta,
    }),
  });
}

export function useInterventionDetail(interventionId: string) {
  return useQuery({
    queryKey: ["faculty", "intervention", interventionId],
    queryFn: () =>
      api.get<Intervention>(`/api/faculty/me/interventions/${interventionId}`),
    select: (res) => res.data,
    enabled: !!interventionId,
  });
}

export function useCreateIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInterventionRequest) =>
      api.post<Intervention>("/api/faculty/me/interventions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "interventions"] });
      queryClient.invalidateQueries({ queryKey: ["faculty", "dashboard"] });
    },
  });
}

export function useUpdateIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Partial<
      Pick<Intervention, "status" | "outcomes"> & { note: string }
    >) => api.patch<Intervention>(`/api/faculty/me/interventions/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faculty", "intervention", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["faculty", "interventions"] });
      queryClient.invalidateQueries({ queryKey: ["faculty", "dashboard"] });
    },
  });
}

// === Courses ===
export function useFacultyCourses() {
  return useQuery({
    queryKey: ["faculty", "courses"],
    queryFn: () => api.get<FacultyCourse[]>("/api/faculty/me/courses"),
    select: (res) => res.data,
  });
}

export function useFacultyCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "course", courseId],
    queryFn: () =>
      api.get<FacultyCourseDetail>(`/api/faculty/me/courses/${courseId}`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

// === Research ===
export function useFacultyGrants(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["faculty", "grants", params],
    queryFn: () =>
      api.get<FacultyGrant[]>(
        `/api/faculty/me/grants${qs ? `?${qs}` : ""}`
      ),
    select: (res) => ({
      grants: res.data,
      meta: res.meta as PaginationMeta,
    }),
  });
}

export function useFacultyCollaborations(params?: { search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["faculty", "collaborations", params],
    queryFn: () =>
      api.get<FacultyCollaboration[]>(
        `/api/faculty/me/collaborations${qs ? `?${qs}` : ""}`
      ),
    select: (res) => res.data,
  });
}

export function useFacultyPublications(params?: {
  type?: string;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.search) searchParams.set("search", params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["faculty", "publications", params],
    queryFn: () =>
      api.get<FacultyPublication[]>(
        `/api/faculty/me/publications${qs ? `?${qs}` : ""}`
      ),
    select: (res) => res.data,
  });
}

// === Briefings ===
export function useBriefings() {
  return useQuery({
    queryKey: ["faculty", "briefings"],
    queryFn: () => api.get<AiBriefing[]>("/api/faculty/me/briefings"),
    select: (res) => res.data,
  });
}

export function useBriefingDetail(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "briefing", courseId],
    queryFn: () =>
      api.get<AiBriefing>(`/api/faculty/me/briefings/${courseId}`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

export function useToggleBriefingAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      actionIndex,
    }: {
      courseId: string;
      actionIndex: number;
    }) =>
      api.patch(
        `/api/faculty/me/briefings/${courseId}/action-items/${actionIndex}`
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faculty", "briefing", variables.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["faculty", "briefings"] });
    },
  });
}

// === Profile ===
export function useFacultyProfile() {
  return useQuery({
    queryKey: ["faculty", "profile"],
    queryFn: () => api.get<FacultyProfile>("/api/faculty/me/profile"),
    select: (res) => res.data,
  });
}

export function useUpdateFacultyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FacultyProfile>) =>
      api.patch<FacultyProfile>("/api/faculty/me/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "profile"] });
    },
  });
}

// === Grant Status Change ===
export function useUpdateGrantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ grantId, status }: { grantId: string; status: string }) =>
      api.patch<FacultyGrant>(`/api/faculty/me/grants/${grantId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "grants"] });
      queryClient.invalidateQueries({ queryKey: ["faculty", "dashboard"] });
    },
  });
}

// === Notification Preferences ===
export function useFacultyNotificationPreferences() {
  return useQuery({
    queryKey: ["faculty", "notification-preferences"],
    queryFn: () => api.get<FacultyNotificationPreferences>("/api/faculty/me/notification-preferences"),
    select: (res) => res.data,
  });
}

export function useUpdateFacultyNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FacultyNotificationPreferences>) =>
      api.patch<FacultyNotificationPreferences>("/api/faculty/me/notification-preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "notification-preferences"] });
    },
  });
}

// === Intervention Note Edit/Delete ===
export function useEditInterventionNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ interventionId, noteIndex, content }: { interventionId: string; noteIndex: number; content: string }) =>
      api.patch(`/api/faculty/me/interventions/${interventionId}/notes/${noteIndex}`, { content }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "intervention", vars.interventionId] });
      queryClient.invalidateQueries({ queryKey: ["faculty", "interventions"] });
    },
  });
}

export function useDeleteInterventionNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ interventionId, noteIndex }: { interventionId: string; noteIndex: number }) =>
      api.delete(`/api/faculty/me/interventions/${interventionId}/notes/${noteIndex}`),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "intervention", vars.interventionId] });
      queryClient.invalidateQueries({ queryKey: ["faculty", "interventions"] });
    },
  });
}
