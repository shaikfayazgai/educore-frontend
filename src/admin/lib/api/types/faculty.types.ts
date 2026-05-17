import type { Identifiable, Timestamps, RiskLevel, InterventionStatus } from "./common.types";

// === Dashboard ===
export interface FacultyDashboard {
  atRiskStudentCount: number;
  activeInterventions: number;
  totalStudents: number;
  upcomingClasses: UpcomingClass[];
  grantAlerts: GrantAlert[];
  researchMetrics: {
    publications: number;
    citations: number;
    hIndex: number;
    activeGrants: number;
  };
  weeklyTrend: { day: string; atRisk: number; interventions: number }[];
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

export interface GrantAlert extends Identifiable {
  title: string;
  fundingBody: string;
  deadline: string;
  amount: number;
  alignmentScore: number;
  isNew: boolean;
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
  interventions: Intervention[];
  riskAlerts: { type: string; severity: RiskLevel; message: string; date: string }[];
  coursePerformance: { courseCode: string; courseName: string; grade: string; attendance: number; assignments: number }[];
}

// === Interventions ===
export interface Intervention extends Identifiable, Timestamps {
  studentId: string;
  studentName: string;
  type: "academic_support" | "counseling" | "mentoring" | "schedule_adjustment" | "financial_aid";
  description: string;
  goals: string[];
  status: InterventionStatus;
  startDate: string;
  endDate?: string;
  outcomes?: string;
  notes: { date: string; content: string; author: string }[];
  createdBy: string;
}

export interface CreateInterventionRequest {
  studentId: string;
  type: Intervention["type"];
  description: string;
  goals: string[];
  startDate: string;
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

// === Research ===
export interface FacultyGrant extends Identifiable {
  title: string;
  fundingBody: string;
  amount: number;
  currency: string;
  alignmentScore: number;
  successProbability: number;
  deadline: string;
  topics: string[];
  status: "discovered" | "interested" | "drafting" | "submitted" | "funded" | "rejected";
  matchExplanation: string;
  requirements: string[];
}

export interface FacultyCollaboration extends Identifiable {
  name: string;
  institution: string;
  department: string;
  expertise: string[];
  sharedPublications: number;
  matchScore: number;
  email: string;
  avatarUrl: string | null;
}

export interface FacultyPublication extends Identifiable {
  title: string;
  journal: string;
  year: number;
  citations: number;
  coAuthors: string[];
  doi?: string;
  type: "journal" | "conference" | "book_chapter" | "preprint";
  status: "published" | "in_review" | "accepted" | "preprint";
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
  researchInterests: string[];
  expertise: string[];
  socialLinks: { platform: string; url: string }[];
}

export interface FacultyNotificationPreferences {
  email: boolean;
  push: boolean;
  studentRiskAlerts: boolean;
  interventionUpdates: boolean;
  grantDeadlines: boolean;
  briefingReady: boolean;
  collaborationRequests: boolean;
  citationAlerts: boolean;
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
export interface FacultyAssignment extends Identifiable {
  courseId: string;
  title: string;
  description: string;
  type: "assignment" | "exam" | "project" | "quiz";
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
  type: "assignment" | "exam" | "project" | "quiz";
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
export interface GradebookEntry {
  studentId: string;
  studentName: string;
  assignments: { assignmentId: string; title: string; score: number | null; maxScore: number; weight: number; status: string }[];
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
