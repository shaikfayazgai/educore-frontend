import type {
  Identifiable,
  Timestamps,
  TenantScoped,
  PortalRole,
  RiskLevel,
  ComplianceStatus,
  CredentialStatus,
  ModelStatus,
} from "./common.types";

// === Dashboard ===
export interface AdminDashboard {
  enrollment: { total: number; trend: number; byDepartment: { name: string; count: number }[] };
  retention: { rate: number; trend: number };
  graduation: { rate: number; trend: number };
  compliance: { score: number; status: ComplianceStatus; deviations: number };
  facultyStudentRatio: number;
  enrollmentTrend: { month: string; count: number }[];
}

// === Analytics ===
export interface InstitutionalAnalytics {
  kpis: {
    name: string;
    value: number;
    previousValue: number;
    unit: string;
    trend: "up" | "down" | "stable";
  }[];
  departmentComparison: {
    department: string;
    enrollment: number;
    retention: number;
    graduation: number;
    avgGpa: number;
    placementRate: number;
  }[];
  yearlyTrends: {
    year: string;
    enrollment: number;
    retention: number;
    graduation: number;
  }[];
}

// === Compliance ===
export interface CompliancePulse {
  overallScore: number;
  status: ComplianceStatus;
  categories: ComplianceCategory[];
  recentDeviations: ComplianceDeviation[];
  frameworkScores: { framework: string; score: number; status: ComplianceStatus }[];
}

export interface ComplianceCategory {
  name: string;
  score: number;
  status: ComplianceStatus;
  checkedAt: string;
  items: { name: string; status: "pass" | "fail" | "warning"; detail: string }[];
}

export interface ComplianceDeviation extends Identifiable, Timestamps {
  category: string;
  severity: RiskLevel;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: string;
  assignedTo?: string;
}

// === Audit Trail ===
export interface AuditLogEntry extends Identifiable {
  timestamp: string;
  userId: string;
  userName: string;
  userRole: PortalRole;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  outcome: "success" | "failure";
}

// === Users & Roles ===
export interface AdminUser extends Identifiable, Timestamps, TenantScoped {
  email: string;
  name: string;
  role: PortalRole;
  department: string;
  status: "active" | "inactive" | "suspended";
  lastLoginAt: string | null;
  avatarUrl: string | null;
  phone?: string;
  /** True the moment the admin's onboarding email actually delivered. Drives
   *  the "Onboarded / Not onboarded" filter on the Users page. */
  onboarded?: boolean;
  welcomedAt?: string | null;
  isPasswordSet?: boolean;
  mustChangePassword?: boolean;
  /** Unified human-readable identifier for every role — replaces the
   *  legacy split between studentId / employeeId. Backend echoes both
   *  legacy aliases too for any consumer that still keys off them. */
  idNo?: string;
  // Student-specific
  studentId?: string;
  program?: string;
  academicYearStart?: string;
  academicYearEnd?: string;
  currentSemester?: string;
  // Faculty-specific
  employeeId?: string;
  designation?: string;
  specialization?: string;
}

// === Programs & Degrees ===
export type DegreeType = "UG" | "PG" | "Diploma" | "PhD";

export interface Program extends Identifiable, Timestamps {
  name: string;
  /** Short code (CSE / ECE / MBA). Backend derives one when omitted on create
   *  and enforces uniqueness across the tenant. Optional on the type only
   *  because legacy MSW mocks don't generate one; the real API always sends
   *  a value back. */
  code?: string;
  department: string;
  duration: number; // years
  totalSemesters: number;
  degreeType: DegreeType;
  status: "active" | "inactive";
  studentCount: number;
}

export interface CreateProgramRequest {
  name: string;
  /** Optional — backend derives from the name when omitted. */
  code?: string;
  department: string;
  duration: number;
  totalSemesters: number;
  degreeType: DegreeType;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: PortalRole;
  /** Optional: placement officers are institution-wide and don't carry a
   *  department. Every other role (student/faculty/admin) still requires
   *  one — that check lives in the zod schema's superRefine. */
  department?: string;
  /** Unified ID No. — preferred wire field. Legacy studentId / employeeId
   *  are still accepted by the backend for CSV imports. */
  idNo?: string;
  studentId?: string;
  program?: string;
  academicYearStart?: string;
  academicYearEnd?: string;
  currentSemester?: string;
  employeeId?: string;
  designation?: string;
  specialization?: string;
}

export interface RoleDefinition {
  role: PortalRole;
  label: string;
  description: string;
  userCount: number;
  permissions: Permission[];
}

export interface Permission {
  module: string;
  actions: { name: string; allowed: boolean }[];
}

// === Budget ===
export interface BudgetOverview {
  totalBudget: number;
  spent: number;
  remaining: number;
  utilizationRate: number;
  byDepartment: { department: string; allocated: number; spent: number }[];
  monthlySpend: { month: string; amount: number }[];
  alerts: BudgetAlert[];
}

export interface BudgetAlert extends Identifiable {
  department: string;
  type: "overspend" | "approaching_limit" | "anomaly";
  message: string;
  severity: RiskLevel;
  date: string;
}

// === AI Governance ===
export interface AiModel extends Identifiable {
  name: string;
  version: string;
  domain: string;
  status: ModelStatus;
  accuracy: number;
  lastTrainedAt: string;
  dataPoints: number;
  biasScore: number;
  fairnessMetrics: { demographic: string; score: number }[];
  description: string;
  owner: string;
}

export interface BiasReport extends Identifiable, Timestamps {
  modelId: string;
  modelName: string;
  reportDate: string;
  overallScore: number;
  demographics: {
    group: string;
    metric: string;
    value: number;
    threshold: number;
    status: "pass" | "fail" | "warning";
  }[];
  recommendations: string[];
  reviewedBy?: string;
}

export interface AiOverrideLog extends Identifiable {
  timestamp: string;
  modelName: string;
  originalDecision: string;
  overriddenTo: string;
  reason: string;
  overriddenBy: string;
  affectedEntity: string;
}

// === Credentials Management ===
export interface AdminCredential extends Identifiable, Timestamps {
  studentName: string;
  studentId: string;
  title: string;
  type: "degree" | "certificate" | "badge" | "transcript";
  status: CredentialStatus;
  issuedDate: string;
  verificationHash?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface IssueCredentialRequest {
  studentId: string;
  title: string;
  type: "degree" | "certificate" | "badge" | "transcript";
  description: string;
}

// === Reports ===
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "compliance" | "enrollment" | "financial" | "performance" | "custom";
  parameters: ReportParameter[];
  lastGenerated?: string;
}

export interface ReportParameter {
  name: string;
  type: "date" | "select" | "text";
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

export interface GeneratedReport extends Identifiable, Timestamps {
  templateId: string;
  templateName: string;
  status: "generating" | "completed" | "failed";
  parameters: Record<string, string>;
  downloadUrl?: string;
  generatedBy: string;
  fileSize?: number;
}

// === Course Catalog (design-time master) — added for Catalog/Offerings tabs ===
// One catalog row defines what a course IS. Many offerings reuse it across
// terms and sections.
export type CourseType = "core" | "programme_elective" | "open_elective";

export interface CourseCatalog extends Identifiable, Timestamps {
  code: string;
  name: string;
  description: string;
  syllabus: string;
  regulation: string;
  credits: number;
  courseType: CourseType;
  owningDepartmentId: string | null;
  owningDepartmentName: string | null;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  status: "active" | "archived";
  offeringCount: number;
}

export interface CreateCourseCatalogRequest {
  code: string;
  name: string;
  description: string;
  syllabus: string;
  regulation: string;
  credits: number;
  courseType: CourseType;
  owningDepartmentId: string | null;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
}

// === Sections (programme cohort) ===
export interface Section extends Identifiable, Timestamps {
  name: string;
  programmeId: string;
  programmeName: string;
  department: string;
  studyYear: 1 | 2 | 3 | 4 | 5;
  studentCount: number;
  status: "active" | "archived";
}

// === Departments (master data) ===
export interface Department extends Identifiable, Timestamps {
  name: string;
  code: string;
  hodName?: string;
  status: "active" | "archived";
}

// === Course Offering (run-time instance) ===
export interface CourseOffering extends Identifiable, Timestamps {
  catalogId: string;
  catalogCode: string;
  catalogName: string;
  courseType: CourseType;
  academicYearId: string;
  academicYearName: string;
  semesterId: string;
  semesterName: string;
  // Backend currently returns studyYear as a plain int 1..6 (matches the
  // backend column `year_of_study`). Keep the union for legacy callers but
  // widen to `number` so PATCH payloads don't need a cast each time.
  studyYear: number;
  programmeId: string;
  programmeName: string;
  department: string;
  // Backend now also emits the raw `branch` and `section` strings (e.g.
  // "CSE", "A") that compose the `sectionName` display. Editable on the
  // offering detail page's Edit Offering dialog.
  branch?: string;
  section?: string;
  sectionId: string;
  sectionName: string;
  facultyId: string | null;
  facultyName: string | null;
  enrolledCount: number;
  enrolledStudentIds?: string[];
  maxCapacity: number;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  syllabusSnapshot: string;
  regulationSnapshot: string;
  creditsSnapshot: number;
  status: "draft" | "active" | "archived";
}

export interface CreateCourseOfferingRequest {
  catalogId: string;
  academicYearId: string;
  semesterId: string;
  studyYear: 1 | 2 | 3 | 4 | 5;
  // sectionId is no longer required now that enrollment is driven by
  // direct student selection. Kept for backward-compat with any older
  // callers that still send it.
  sectionId?: string;
  facultyId: string | null;
  maxCapacity: number;
  // Student IDs picked via the cascading filter + checkbox grid. Min 1
  // enforced client-side; backend currently ignores extras gracefully.
  studentIds?: string[];
}

export interface AssignFacultyRequest {
  facultyId: string;
}

// === Courses ===
export interface AdminCourse extends Identifiable, Timestamps {
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  semesterId: string;
  semesterName: string;
  facultyId: string;
  facultyName: string;
  enrolledCount: number;
  enrolledStudentIds?: string[];
  maxCapacity: number;
  status: "draft" | "active" | "archived";
}

export interface CreateCourseRequest {
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  semesterId: string;
  facultyId: string;
  maxCapacity: number;
}

export interface BulkEnrollRequest {
  courseId: string;
  studentIds: string[];
}

// === Semesters ===
export interface Semester extends Identifiable, Timestamps {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  courseCount: number;
  academicYearId?: string;
}

export interface CreateSemesterRequest {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  academicYearId?: string;
}

// === Academic Year ===
export interface AcademicYear extends Identifiable, Timestamps {
  name: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  semesters: Semester[];
  /** When the auto-promotion routine fired for this AY. Null means it
   *  hasn't run yet — surfaces a "Promote students" button on the AY
   *  card when end_date has passed. */
  promotedAt?: string | null;
  /** How many students moved up one year on the last promotion run. */
  promotedCount?: number;
  /** How many students hit their programme's final semester and were
   *  flipped to `status=inactive` (graduated path). */
  graduatedCount?: number;
}

export interface CreateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
}

// === Bulk Import ===
export interface BulkImportUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "faculty" | "admin" | "placement";
  department: string;
  /** Unified ID No. — CSV imports may still send studentId / employeeId
   *  which the backend folds into the same canonical column. */
  idNo?: string;
  studentId?: string;
  program?: string;
  employeeId?: string;
  /** When true, dispatch the credential / onboarding email immediately on import.
   *  When false, the user is still created — the admin can resend the invitation
   *  later from the Users list. Driven by the per-row checkbox in the import
   *  dialog. */
  sendInvitation?: boolean;
}

// === Settings ===
export interface InstitutionSettings {
  name: string;
  shortName: string;
  domain: string;
  timezone: string;
  locale: string;
  academicYear: string;
  logo?: string;
  primaryColor: string;
  visibility: {
    shareWithMinistry: boolean;
    anonymizeData: boolean;
    publicProfile: boolean;
  };
  dataRetention: {
    studentRecords: number;
    auditLogs: number;
    analyticsData: number;
  };
}
