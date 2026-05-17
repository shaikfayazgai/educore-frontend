import type { Identifiable, Timestamps, RiskLevel } from "./common.types";

// === Notifications ===
export interface FacultyNotification {
  id: string;
  type: "assignment_submission" | "risk_alert" | "grade_posted" | string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

// === Dashboard ===
export interface FacultyDashboard {
  atRiskStudentCount: number;
  totalStudents: number;
  upcomingClasses: UpcomingClass[];
  weeklyTrend: { day: string; atRisk: number }[];
}

export interface UpcomingClass {
  courseId: string;
  courseName: string;
  courseCode: string;
  time: string;
  endTime: string;
  room: string;
  studentsAtRisk: number;
  totalStudents: number;
}

// === Students ===
export interface FacultyStudentListItem extends Identifiable {
  name: string;
  studentId: string;
  email: string;
  department: string;
  program: string;
  semester: number;
  gpa: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastActivity: string;
  avatarUrl: string | null;
  courses: string[];
  attendanceRate: number;
}

export interface FacultyStudentDetail extends FacultyStudentListItem {
  phone?: string;
  enrollmentYear: number;
  creditsCompleted: number;
  creditsRequired: number;
  skills: { name: string; score: number; trend: "up" | "down" | "stable" }[];
  gpaHistory: { semester: string; gpa: number }[];
  attendanceHistory: { date: string; status: "present" | "absent" | "late"; courseName: string }[];
  riskAlerts: { type: string; severity: RiskLevel; message: string; date: string }[];
  coursePerformance: { courseCode: string; courseName: string; grade: string; attendance: number; assignments: number }[];
}

// === Courses ===
export interface FacultyCourse extends Identifiable, Timestamps {
  code: string;
  name: string;
  semester: string;
  credits: number;
  totalStudents: number;
  studentsAtRisk: number;
  averageGrade: number;
  attendanceRate: number;
  schedule: string;
  room: string;
}

export interface FacultyCourseDetail extends FacultyCourse {
  students: { id: string; name: string; gpa: number; attendance: number; grade: string; riskLevel: RiskLevel }[];
  gradeDistribution: { grade: string; count: number }[];
  attendanceTrend: { week: string; rate: number }[];
  assignmentCompletion: { name: string; submitted: number; total: number; averageScore: number }[];
  engagementMetrics: { metric: string; value: number; benchmark: number }[];
}

// === Briefings ===
export interface AiBriefing extends Identifiable {
  courseId: string;
  courseName: string;
  courseCode: string;
  classTime: string;
  generatedAt: string;
  keyInsights: string[];
  studentsToWatch: { studentId: string; name: string; reason: string; riskLevel: RiskLevel }[];
  topicSuggestions: string[];
  actionItems: { text: string; priority: "high" | "medium" | "low"; completed: boolean }[];
  classMetrics: { metric: string; value: string; trend: "up" | "down" | "stable" }[];
}

// === Settings ===
export interface FacultyProfile {
  id?: string;
  name: string;
  email: string;
  facultyId: string;
  department: string;
  title: string;
  officeHours: string;
  office: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string | null;
  expertise: string[];
  socialLinks: { platform: string; url: string }[];
  researchInterests?: string[];
  qualifications?: string[];
  dateOfJoining?: string | null;
  orcid?: string | null;
  createdAt?: string | null;
  welcomedAt?: string | null;
  lastLoginAt?: string | null;
}

export interface FacultyNotificationPreferences {
  email: boolean;
  push: boolean;
  studentRiskAlerts: boolean;
  briefingReady: boolean;
}

// === Course Content (LMS) ===
export interface CourseModule extends Identifiable {
  courseId: string;
  title: string;
  description: string;
  order: number;
  materials: CourseMaterial[];
}

export interface CourseMaterial extends Identifiable {
  moduleId: string;
  title: string;
  type: "pdf" | "video" | "slides" | "link";
  url: string;
  fileUrl?: string;
  fileSize?: number;
  duration?: number;
  uploadedAt: string;
}

export interface CreateModuleRequest {
  courseId: string;
  title: string;
  description: string;
}

// === Assignments (LMS) ===
// File-submission work only. Quizzes/exams now live as Assessments — see
// `assessment.types.ts`. The Assignment.type enum no longer carries quiz/exam.
export interface FacultyAssignment extends Identifiable {
  courseId: string;
  title: string;
  description: string;
  type: "assignment" | "project";
  dueDate: string;
  maxScore: number;
  weight: number;
  status: "draft" | "published" | "closed";
  submissionCount: number;
  gradedCount: number;
  rubric: AssignmentRubric[];
}

export interface AssignmentRubric {
  criterion: string;
  description: string;
  maxPoints: number;
}

export interface CreateAssignmentRequest {
  courseId: string;
  title: string;
  description: string;
  type: "assignment" | "project";
  dueDate: string;
  maxScore: number;
  weight: number;
  rubric: { criterion: string; description: string; maxPoints: number }[];
}

export interface StudentSubmission extends Identifiable {
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  fileName: string;
  fileUrl: string;
  score?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late";
}

export interface GradeSubmissionRequest {
  submissionId: string;
  score: number;
  feedback: string;
}

// === Gradebook ===
export interface GradebookAssignmentCell {
  assignmentId: string;
  title: string;
  score: number | null;
  maxScore: number;
  weight: number;
  status: string;
}

export interface GradebookAssessmentCell {
  assessmentId: string;
  title: string;
  /** Best score across the student's submitted attempts, or null if untaken. */
  score: number | null;
  maxScore: number;
  weight: number;
  /** "graded" once an attempt has been submitted; "pending" otherwise. */
  status: string;
}

export interface GradebookEntry {
  studentId: string;
  studentName: string;
  assignments: GradebookAssignmentCell[];
  assessments: GradebookAssessmentCell[];
  weightedAverage: number;
}

// === Attendance ===
export interface AttendanceSession extends Identifiable {
  courseId: string;
  date: string;
  topic: string;
  records: AttendanceRecord[];
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: "present" | "absent" | "late";
}

export interface CreateAttendanceSessionRequest {
  courseId: string;
  date: string;
  topic: string;
}
