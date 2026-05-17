"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/admin/lib/api/client";
import type {
  AdminDashboard,
  InstitutionalAnalytics,
  CompliancePulse,
  ComplianceDeviation,
  AuditLogEntry,
  AdminUser,
  CreateUserRequest,
  RoleDefinition,
  BudgetOverview,
  AiModel,
  BiasReport,
  AiOverrideLog,
  AdminCredential,
  IssueCredentialRequest,
  ReportTemplate,
  GeneratedReport,
  InstitutionSettings,
  AdminCourse,
  CreateCourseRequest,
  Semester,
  CreateSemesterRequest,
  Program,
  CreateProgramRequest,
  AcademicYear,
  CreateAcademicYearRequest,
  BulkImportUserRequest,
  CourseCatalog,
  CreateCourseCatalogRequest,
  CourseOffering,
  CreateCourseOfferingRequest,
  AssignFacultyRequest,
  Department,
  Section,
} from "@/admin/lib/api/types/admin.types";
import type { PaginationMeta } from "@/admin/lib/api/types/common.types";

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
  /** "true" → only onboarded (welcomed_at IS NOT NULL); "false" → not onboarded. */
  onboarded?: "true" | "false";
  page?: number;
  pageSize?: number;
  /** Column to sort by — backend allowlist: name, email, role, status,
   *  department, created_at, last_login_at, welcomed_at, updated_at. */
  sortBy?: string;
  /** Sort direction: "asc" | "desc". Defaults to desc (most-recent first). */
  sortDir?: "asc" | "desc";
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.role) sp.set("role", params.role);
  if (params?.status) sp.set("status", params.status);
  if (params?.onboarded) sp.set("onboarded", params.onboarded);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortDir) sp.set("sortDir", params.sortDir);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => api.get<AdminUser[]>(`/api/admin/users${qs ? `?${qs}` : ""}`),
    select: (res) => ({ users: res.data, meta: res.meta as PaginationMeta }),
  });
}

// ── Onboarding (bulk-send credential emails to checked users) ─────────────

export interface SendOnboardingResult {
  matchedCount: number;
  resetCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
}

export function useSendOnboardingEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { userIds: string[]; forceReset?: boolean }) =>
      api.post<SendOnboardingResult>("/api/admin/users/credential-emails", {
        userIds: input.userIds,
        // We always want to (re-)issue a temp password and force a change on
        // first login; the previously-checked accounts are precisely the ones
        // the admin wants to onboard right now.
        forceReset: input.forceReset ?? true,
        onlyPending: false,
        limit: input.userIds.length,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// ── Tenant support contact (rendered on the lockout page) ─────────────────

export interface SupportContact {
  contactName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  helpText: string;
}

export function useSupportContact() {
  return useQuery({
    queryKey: ["admin", "settings", "support-contact"],
    queryFn: () => api.get<SupportContact>("/api/admin/settings/support-contact"),
    select: (res) => res.data,
  });
}

export function useUpdateSupportContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SupportContact>) =>
      api.patch<SupportContact>("/api/admin/settings/support-contact", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings", "support-contact"] });
    },
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

export function useBulkImportUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { users: BulkImportUserRequest[] }) =>
      api.post<{ imported: number; errors: number }>("/api/admin/users/bulk", data),
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

/** Hard-delete a user. Backend wipes the row from `login_accounts`; there's
 *  no soft-delete column. Caller should always wrap this in a confirmation
 *  dialog — the row is gone, audit trail aside. */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ deleted: number }>(`/api/admin/users/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin", "user", id] });
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

export function useUpdateAiModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AiModel>) =>
      api.patch<AiModel>(`/api/admin/ai-governance/models/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "model", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "models"] });
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "overview"] });
    },
  });
}

export function useTriggerRetrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) =>
      api.post<AiModel>(`/api/admin/ai-governance/models/${modelId}/retrain`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "models"] });
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "overview"] });
    },
  });
}

export function useBiasReports() {
  return useQuery({
    queryKey: ["admin", "ai-governance", "bias-reports"],
    queryFn: () => api.get<BiasReport[]>("/api/admin/ai-governance/bias-reports"),
    select: (res) => res.data,
  });
}

export function useReviewBiasReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewedBy }: { id: string; reviewedBy: string }) =>
      api.patch<BiasReport>(`/api/admin/ai-governance/bias-reports/${id}/review`, { reviewedBy }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "bias-reports"] });
    },
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
    refetchInterval: (query) => {
      const data = query.state.data?.data as GeneratedReport[] | undefined;
      const anyPending = data?.some((r) => r.status === "generating");
      return anyPending ? 2000 : false;
    },
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

// === Courses ===
export function useAdminCourses(params?: {
  search?: string;
  department?: string;
  semester?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.department) sp.set("department", params.department);
  if (params?.semester) sp.set("semester", params.semester);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "courses", params],
    queryFn: () => api.get<AdminCourse[]>(`/api/admin/courses${qs ? `?${qs}` : ""}`),
    select: (res) => ({ courses: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useAdminCourseDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "course", id],
    queryFn: () => api.get<AdminCourse>(`/api/admin/courses/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseRequest) =>
      api.post<AdminCourse>("/api/admin/courses", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AdminCourse>) =>
      api.patch<AdminCourse>(`/api/admin/courses/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "course", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
  });
}

/** Replace an offering's entire roster. Backend handles the set diff:
 *  inserts the new student IDs, marks departed students 'dropped' (kept
 *  for history rather than hard-deleted so attendance/marks tied to
 *  course_id + student_id stay reachable). */
export function useReplaceOfferingEnrollments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, studentIds }: { id: string; studentIds: string[] }) =>
      api.put<{ offeringId: string; added: number; dropped: number; enrolled: number }>(
        `/api/admin/course-offerings/${id}/enrollments`,
        { studentIds },
      ),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "course-offering", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "course-offerings"] });
    },
  });
}

/** PATCH on the course-OFFERING (run-time instance), not the catalog row.
 *  Backend accepts: facultyId, branch, yearOfStudy, section, maxCapacity,
 *  status. Different endpoint to useUpdateCourse — using the wrong one is
 *  why earlier Archive / edit attempts from the detail page silently
 *  failed against the catalog row. */
export function useUpdateOffering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & {
      facultyId?: string | null;
      branch?: string;
      yearOfStudy?: number;
      section?: string;
      maxCapacity?: number;
      status?: string;
    }) =>
      api.patch<unknown>(`/api/admin/course-offerings/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "course-offering", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "course-offerings"] });
    },
  });
}

export function useEnrollStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentIds }: { courseId: string; studentIds: string[] }) =>
      api.post(`/api/admin/courses/${courseId}/enroll`, { studentIds }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "course", vars.courseId] });
    },
  });
}

export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      api.delete(`/api/admin/courses/${courseId}/enroll/${studentId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "course", vars.courseId] });
    },
  });
}

// === Semesters ===
export function useSemesters() {
  return useQuery({
    queryKey: ["admin", "semesters"],
    queryFn: () => api.get<Semester[]>("/api/admin/semesters"),
    select: (res) => res.data,
  });
}

export function useCreateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSemesterRequest) =>
      api.post<Semester>("/api/admin/semesters", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

export function useUpdateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Semester>) =>
      api.patch<Semester>(`/api/admin/semesters/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

// === Programs & Degrees ===

export function usePrograms(params?: { search?: string; degreeType?: string; status?: string }) {
  return useQuery({
    queryKey: ["admin", "programs", params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set("search", params.search);
      if (params?.degreeType) sp.set("degreeType", params.degreeType);
      if (params?.status) sp.set("status", params.status);
      const qs = sp.toString();
      return api.get<Program[]>(`/api/admin/programs${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProgramRequest) =>
      api.post<Program>("/api/admin/programs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Program>) =>
      api.patch<Program>(`/api/admin/programs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

/** Hard-delete a programme. Backend wipes the row and any
 *  `programme_academic_years` mappings cascade off it. Use with a
 *  confirmation dialog — this can't be undone. */
export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ deleted: number }>(`/api/admin/programs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

// === Academic Years ===

export function useAcademicYears() {
  return useQuery({
    queryKey: ["admin", "academic-years"],
    queryFn: () => api.get<AcademicYear[]>("/api/admin/academic-years"),
    select: (res) => res.data,
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAcademicYearRequest) =>
      api.post<AcademicYear>("/api/admin/academic-years", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "academic-years"] });
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AcademicYear>) =>
      api.patch<AcademicYear>(`/api/admin/academic-years/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "academic-years"] });
    },
  });
}

/** Manually trigger the year-end student promotion for one academic year.
 *  Auto-runs the same way `list_academic_years` does lazily, but this hook
 *  is for the "Promote students" button on the Academic Calendar UI — the
 *  admin can fire promotion early or re-run it on demand.
 *
 *  Backend returns `{ promoted, graduated }`. Both are reflected in the
 *  AY row's `promotedCount` / `graduatedCount` after the next list refetch,
 *  so the cache invalidation here also re-fetches student lists (their
 *  `currentSemester` changes mean Year-of-Study filters in the picker
 *  shift to the new buckets). */
export function usePromoteAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ promoted: number; graduated: number }>(
        `/api/admin/academic-years/${id}/promote`,
        {},
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "academic-years"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateNestedSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Semester>) =>
      api.patch<Semester>(`/api/admin/semesters/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "academic-years"] });
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

// === Departments (master data) — used by Courses Catalog/Offerings tabs ===
export function useDepartments() {
  return useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => api.get<Department[]>("/api/admin/departments"),
    select: (res) => res.data,
  });
}

// === Sections (programme cohort) ===
export function useSections(params?: { programmeId?: string; studyYear?: number }) {
  const sp = new URLSearchParams();
  if (params?.programmeId) sp.set("programmeId", params.programmeId);
  if (params?.studyYear) sp.set("studyYear", String(params.studyYear));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "sections", params],
    queryFn: () => api.get<Section[]>(`/api/admin/sections${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

// === Course Catalog (design-time master) ===
export function useCourseCatalog(params?: {
  search?: string;
  departmentId?: string;
  courseType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.departmentId) sp.set("departmentId", params.departmentId);
  if (params?.courseType) sp.set("courseType", params.courseType);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "course-catalog", params],
    queryFn: () =>
      api.get<CourseCatalog[]>(`/api/admin/course-catalog${qs ? `?${qs}` : ""}`),
    select: (res) => ({ catalog: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useCatalogDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "course-catalog", "detail", id],
    queryFn: () => api.get<CourseCatalog>(`/api/admin/course-catalog/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseCatalogRequest) =>
      api.post<CourseCatalog>("/api/admin/course-catalog", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "course-catalog"] });
    },
  });
}

export function useUpdateCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CourseCatalog>) =>
      api.patch<CourseCatalog>(`/api/admin/course-catalog/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "course-catalog"] });
      qc.invalidateQueries({
        queryKey: ["admin", "course-catalog", "detail", vars.id],
      });
    },
  });
}

// === Course Offerings (run-time instances) ===
export function useCourseOfferings(params?: {
  search?: string;
  catalogId?: string;
  academicYearId?: string;
  semesterId?: string;
  programmeId?: string;
  sectionId?: string;
  department?: string;
  courseType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.catalogId) sp.set("catalogId", params.catalogId);
  if (params?.academicYearId) sp.set("academicYearId", params.academicYearId);
  if (params?.semesterId) sp.set("semesterId", params.semesterId);
  if (params?.programmeId) sp.set("programmeId", params.programmeId);
  if (params?.sectionId) sp.set("sectionId", params.sectionId);
  if (params?.department) sp.set("department", params.department);
  if (params?.courseType) sp.set("courseType", params.courseType);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "course-offerings", params],
    queryFn: () =>
      api.get<CourseOffering[]>(`/api/admin/course-offerings${qs ? `?${qs}` : ""}`),
    select: (res) => ({ offerings: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useCreateOffering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseOfferingRequest) =>
      api.post<CourseOffering>("/api/admin/course-offerings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "course-offerings"] });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "course-catalog"] });
    },
  });
}

export function useAssignFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      offeringId,
      facultyId,
    }: { offeringId: string } & AssignFacultyRequest) =>
      api.post<CourseOffering>(
        `/api/admin/course-offerings/${offeringId}/assign-faculty`,
        { facultyId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "course-offerings"] });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
  });
}

// === Single offering detail — used by /admin/courses/[courseId] page ===
// Returns the enriched CourseOffering shape with catalogCode/catalogName/etc.
// joined in, so the detail page can render without N+1 lookups.
export function useOfferingDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "course-offering", id],
    queryFn: () => api.get<CourseOffering>(`/api/admin/course-offerings/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

// === Programme × Academic-Year mapping ===
// Many-to-many. Each row can override the start/end dates so a programme
// can run on its own calendar within a given AY.

export interface ProgrammeAcademicYear {
  id: string;
  programmeId: string;
  programmeName: string;
  department: string;
  academicYearId: string;
  academicYearName: string;
  startDate: string | null;
  endDate: string | null;
  status: "active" | "archived";
  /** Courses linked to this programme that live in any of the AY's semesters.
   *  Surfaces "how many courses does CS run in 2026-27?" on the mapping row. */
  courseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function useProgrammeAcademicYears(params?: {
  academicYearId?: string;
  programmeId?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.academicYearId) sp.set("academicYearId", params.academicYearId);
  if (params?.programmeId) sp.set("programmeId", params.programmeId);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "programme-academic-years", params],
    queryFn: () =>
      api.get<ProgrammeAcademicYear[]>(`/api/admin/programme-academic-years${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

export function useCreateProgrammeAcademicYears() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      academicYearId?: string;
      programmeId?: string;
      programmeIds?: string[];
      academicYearIds?: string[];
      startDate?: string;
      endDate?: string;
    }) =>
      api.post<{ inserted: number; updated: number }>(
        "/api/admin/programme-academic-years",
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programme-academic-years"] });
    },
  });
}

/** Shape stored in the React Query cache for this endpoint. queryFn
 *  returns the raw ApiResponse, so the cache holds the wrapper, not the
 *  array — `select` only transforms what consumers read. Optimistic
 *  updates must read/write the wrapper or `prev.map` blows up with
 *  "prev.map is not a function" and the mutation rejects before the
 *  network call fires. */
type CachedMappingList = { data: ProgrammeAcademicYear[] };

export function useUpdateProgrammeAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; startDate?: string; endDate?: string; status?: string }) =>
      api.patch<ProgrammeAcademicYear>(`/api/admin/programme-academic-years/${id}`, data),
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ["admin", "programme-academic-years"] });
      const snapshots: [readonly unknown[], unknown][] = [];
      qc.getQueriesData<CachedMappingList>({ queryKey: ["admin", "programme-academic-years"] })
        .forEach(([key, prev]) => {
          if (!prev || !Array.isArray(prev.data)) return;
          snapshots.push([key, prev]);
          qc.setQueryData<CachedMappingList>(key, {
            ...prev,
            data: prev.data.map((m) =>
              m.id === id ? ({ ...m, ...patch } as ProgrammeAcademicYear) : m,
            ),
          });
        });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => qc.setQueryData(key, prev));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programme-academic-years"] });
    },
  });
}

/** Per-course drill-down for the courseCount chip on each mapping row.
 *  Each course row carries the offering metadata (semester, year-of-study,
 *  branch/section, faculty) and a live enrolled-student count. */
export interface ProgrammeAYCourse {
  id: string;
  offeringId: string | null;
  code: string;
  name: string;
  credits: number | null;
  department: string;
  yearOfStudy: number | null;
  branch: string;
  section: string;
  semesterId: string | null;
  semesterName: string;
  facultyName: string;
  facultyEmail: string;
  enrolledCount: number;
}

export interface ProgrammeAYCourseListResponse {
  data: ProgrammeAYCourse[];
  meta: {
    programmeName: string;
    programmeDepartment: string;
    academicYearName: string;
  };
}

/** Drill-down for the per-semester course count chip on each AY card. */
export interface SemesterCourse extends ProgrammeAYCourse {
  programmeName: string;
}

export interface SemesterCourseListResponse {
  data: SemesterCourse[];
  meta: {
    semesterName: string;
    academicYearName: string;
    startDate: string | null;
    endDate: string | null;
  };
}

export function useSemesterCourses(semesterId: string | null) {
  return useQuery({
    queryKey: ["admin", "semesters", semesterId, "courses"],
    queryFn: async () => {
      const res = await api.get<SemesterCourse[]>(
        `/api/admin/semesters/${semesterId}/courses`,
      );
      return res as unknown as SemesterCourseListResponse;
    },
    enabled: !!semesterId,
  });
}

export function useProgrammeAcademicYearCourses(mappingId: string | null) {
  return useQuery({
    queryKey: ["admin", "programme-academic-years", mappingId, "courses"],
    queryFn: async () => {
      const res = await api.get<ProgrammeAYCourse[]>(
        `/api/admin/programme-academic-years/${mappingId}/courses`,
      );
      // Backend returns a custom meta block ({programmeName, …}) that doesn't
      // fit the generic PaginationMeta typing — cast to the per-endpoint
      // envelope so consumers get the typed meta they expect.
      return res as unknown as ProgrammeAYCourseListResponse;
    },
    enabled: !!mappingId,
  });
}

export function useDeleteProgrammeAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean }>(`/api/admin/programme-academic-years/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "programme-academic-years"] });
      const snapshots: [readonly unknown[], unknown][] = [];
      qc.getQueriesData<CachedMappingList>({ queryKey: ["admin", "programme-academic-years"] })
        .forEach(([key, prev]) => {
          if (!prev || !Array.isArray(prev.data)) return;
          snapshots.push([key, prev]);
          qc.setQueryData<CachedMappingList>(key, {
            ...prev,
            data: prev.data.filter((m) => m.id !== id),
          });
        });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => qc.setQueryData(key, prev));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programme-academic-years"] });
    },
  });
}
