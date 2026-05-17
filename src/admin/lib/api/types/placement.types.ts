import type { Identifiable, Timestamps, RiskLevel, PipelineStage, MatchStatus } from "./common.types";

// === Dashboard ===
export interface PlacementDashboard {
  placementRate: number;
  activeMatches: number;
  pipeline: Record<PipelineStage, number>;
  upcomingDrives: { name: string; company: string; date: string; positions: number }[];
  topEmployers: { name: string; hires: number; logo?: string }[];
  monthlyPlacements: { month: string; placed: number; target: number }[];
}

// === Students ===
export interface PlacementStudent extends Identifiable {
  name: string;
  studentId: string;
  department: string;
  program: string;
  gpa: number;
  employabilityScore: number;
  topSkills: string[];
  gapSkills: string[];
  riskLevel: RiskLevel;
  applicationCount: number;
  offerCount: number;
  avatarUrl: string | null;
  graduationDate: string;
}

// === Employers ===
export interface Employer extends Identifiable, Timestamps {
  name: string;
  industry: string;
  size: "startup" | "small" | "medium" | "large" | "enterprise";
  logo?: string;
  activeJobPostings: number;
  totalHires: number;
  engagementScore: number;
  verificationRequests: number;
  contactEmail: string;
  contactName: string;
  website?: string;
  description: string;
  hiringHistory: { year: number; hires: number }[];
  jobPostings: EmployerJob[];
}

export interface EmployerJob extends Identifiable {
  title: string;
  type: "full_time" | "internship" | "part_time" | "contract";
  location: string;
  salary?: { min: number; max: number };
  requiredSkills: string[];
  postedDate: string;
  deadline: string;
  applicants: number;
  status: "active" | "closed" | "filled";
}

// === Matching ===
export interface MatchResult extends Identifiable {
  studentId: string;
  studentName: string;
  studentDepartment: string;
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  explanation: string;
  matchedSkills: string[];
  gapSkills: string[];
  status: MatchStatus;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface MatchRunConfig {
  department?: string;
  minGpa?: number;
  minEmployability?: number;
  maxResults?: number;
}

// === Pipeline ===
export interface PipelineItem extends Identifiable {
  studentId: string;
  studentName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  stage: PipelineStage;
  movedToStageAt: string;
  notes?: string;
  nextAction?: string;
}

// === Reports ===
export interface PlacementReport {
  overallRate: number;
  byDepartment: { department: string; rate: number; placed: number; total: number }[];
  byCohort: { cohort: string; rate: number; avgSalary: number }[];
  equityMetrics: { group: string; rate: number; benchmark: number; status: "above" | "below" | "at" }[];
  timeToPlacement: { stage: string; avgDays: number }[];
  topSkillsDemand: { skill: string; demand: number; supply: number }[];
}

// === Settings ===
export interface PlacementSettings {
  matchingPreferences: {
    minMatchScore: number;
    maxResultsPerRun: number;
    includeInternships: boolean;
    includePartTime: boolean;
    weightGpa: number;
    weightSkills: number;
    weightExperience: number;
  };
  equityParameters: {
    enableEquityCheck: boolean;
    targetDiversityRate: number;
    flagThreshold: number;
  };
  notifications: {
    newMatches: boolean;
    employerMessages: boolean;
    pipelineUpdates: boolean;
    weeklyDigest: boolean;
  };
}
