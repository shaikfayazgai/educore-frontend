import type { Identifiable, Timestamps, RiskLevel } from "./common.types";

// === Admissions Dashboard ===
export interface AdmissionsDashboard {
  currentCycle: string;
  totalApplications: number;
  pendingReview: number;
  accepted: number;
  rejected: number;
  waitlisted: number;
  acceptanceRate: number;
  avgScore: number;
  pipeline: { stage: string; count: number }[];
  byDepartment: { department: string; applications: number; accepted: number; capacity: number }[];
  byMonth: { month: string; applications: number; decisions: number }[];
  demographics: { category: string; count: number; percentage: number }[];
}

// === Applications ===
export interface AdmissionApplication extends Identifiable, Timestamps {
  applicantName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  nationality: string;
  programApplied: string;
  department: string;
  applicationDate: string;
  status: AdmissionStatus;
  aiScore: number; // 0-100
  aiProfile: ApplicantProfile;
  documents: ApplicationDocument[];
  reviewNotes: ReviewNote[];
  decision?: {
    outcome: "accepted" | "rejected" | "waitlisted";
    decidedBy: string;
    decidedAt: string;
    reason?: string;
  };
  interviewScheduled?: string;
  scholarshipEligible: boolean;
}

export type AdmissionStatus =
  | "submitted"
  | "under_review"
  | "interview_scheduled"
  | "interview_completed"
  | "accepted"
  | "rejected"
  | "waitlisted"
  | "enrolled"
  | "withdrawn";

export interface ApplicantProfile {
  academicScore: number;
  extracurricularScore: number;
  essayScore: number;
  recommendationScore: number;
  overallFit: number;
  strengths: string[];
  concerns: string[];
  similarAcceptedStudents: number;
  predictedGpa: number;
  predictedGraduation: number; // probability %
  riskLevel: RiskLevel;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  type: "transcript" | "essay" | "recommendation" | "resume" | "certificate" | "other";
  status: "uploaded" | "verified" | "flagged";
  uploadedAt: string;
}

export interface ReviewNote extends Identifiable {
  author: string;
  content: string;
  date: string;
  type: "general" | "academic" | "interview" | "decision";
}

// === Predictions ===
export interface AdmissionPredictions {
  yieldRate: { predicted: number; historicalAvg: number; confidence: number };
  enrollmentForecast: { department: string; predicted: number; capacity: number; likelihood: number }[];
  qualityMetrics: {
    avgAiScore: number;
    avgAcademicScore: number;
    diversityIndex: number;
    internationalRatio: number;
  };
  trendAnalysis: { year: string; applications: number; accepted: number; enrolled: number; yield: number }[];
  riskFactors: { factor: string; impact: "high" | "medium" | "low"; description: string }[];
  recommendations: AdmissionRecommendation[];
}

export interface AdmissionRecommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "capacity" | "outreach" | "scholarship" | "process";
  status: "pending" | "implemented" | "dismissed";
}

// === Actions ===
export interface ReviewApplicationRequest {
  applicationId: string;
  outcome: "accepted" | "rejected" | "waitlisted";
  reason?: string;
}

export interface ScheduleInterviewRequest {
  applicationId: string;
  date: string;
  time: string;
  interviewerName: string;
}

export interface AddReviewNoteRequest {
  applicationId: string;
  content: string;
  type: "general" | "academic" | "interview" | "decision";
}
