"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/admin/lib/api/client";
import type {
  TutorDashboard,
  LearningPath,
  TutorSession,
  RecommendedLesson,
  TutorBookmark,
} from "@/admin/lib/api/types/tutor.types";

export function useTutorDashboard() {
  return useQuery({
    queryKey: ["tutor", "dashboard"],
    queryFn: () => api.get<TutorDashboard>("/api/students/me/tutor/dashboard"),
    select: (res) => res.data,
  });
}

export function useLearningPaths() {
  return useQuery({
    queryKey: ["tutor", "learning-paths"],
    queryFn: () => api.get<LearningPath[]>("/api/students/me/tutor/learning-paths"),
    select: (res) => res.data,
  });
}

export function useLearningPathDetail(pathId: string) {
  return useQuery({
    queryKey: ["tutor", "learning-path", pathId],
    queryFn: () => api.get<LearningPath>(`/api/students/me/tutor/learning-paths/${pathId}`),
    select: (res) => res.data,
    enabled: !!pathId,
  });
}

export function useStartLearningPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pathId: string) =>
      api.post(`/api/students/me/tutor/learning-paths/${pathId}/start`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor", "learning-paths"] });
      qc.invalidateQueries({ queryKey: ["tutor", "dashboard"] });
    },
  });
}

export function usePauseLearningPath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pathId: string) =>
      api.post(`/api/students/me/tutor/learning-paths/${pathId}/pause`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor", "learning-paths"] });
      qc.invalidateQueries({ queryKey: ["tutor", "dashboard"] });
    },
  });
}

export function useTutorSession(sessionId: string) {
  return useQuery({
    queryKey: ["tutor", "session", sessionId],
    queryFn: () => api.get<TutorSession>(`/api/students/me/tutor/sessions/${sessionId}`),
    select: (res) => res.data,
    enabled: !!sessionId,
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { moduleId: string; pathId: string }) =>
      api.post<TutorSession>("/api/students/me/tutor/sessions/start", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor"] });
    },
  });
}

export function useCompleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, sectionId }: { sessionId: string; sectionId: string }) =>
      api.post(`/api/students/me/tutor/sessions/${sessionId}/complete-section`, { sectionId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tutor", "session", vars.sessionId] });
    },
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, answers }: { sessionId: string; answers: { questionId: string; answer: string }[] }) =>
      api.post<TutorSession>(`/api/students/me/tutor/sessions/${sessionId}/submit-quiz`, { answers }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["tutor", "session", vars.sessionId] });
      qc.invalidateQueries({ queryKey: ["tutor", "learning-paths"] });
      qc.invalidateQueries({ queryKey: ["tutor", "dashboard"] });
      qc.invalidateQueries({ queryKey: ["student", "skills"] });
    },
  });
}

export function useRecommendedLessons() {
  return useQuery({
    queryKey: ["tutor", "recommended"],
    queryFn: () => api.get<RecommendedLesson[]>("/api/students/me/tutor/recommended"),
    select: (res) => res.data,
  });
}

export function useUpdateWeeklyGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (target: number) =>
      api.patch("/api/students/me/tutor/preferences", { weeklyGoalTarget: target }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor", "dashboard"] });
    },
  });
}

export function useTutorBookmarks() {
  return useQuery({
    queryKey: ["tutor", "bookmarks"],
    queryFn: () => api.get<TutorBookmark[]>("/api/students/me/tutor/bookmarks"),
    select: (res) => res.data,
  });
}

export function useAddBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { sectionId: string; sectionTitle: string; pathTitle: string; skill: string }) =>
      api.post<TutorBookmark>("/api/students/me/tutor/bookmarks", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor", "bookmarks"] });
    },
  });
}
