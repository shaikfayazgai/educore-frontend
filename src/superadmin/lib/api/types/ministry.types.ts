import type { Identifiable, Timestamps, ComplianceStatus, RiskLevel } from "./common.types";

// === Dashboard ===
export interface MinistryDashboard {
  institutions: { total: number; compliant: number; atRisk: number; nonCompliant: number };
  enrollment: { national: number; trend: number; byRegion: { region: string; count: number }[] };
  graduation: { nationalRate: number; trend: number };
  compliance: { nationalScore: number; deviations: number };
  budgetUtilization: number;
  highlights: { label: string; value: string; trend: "up" | "down" | "stable" }[];
}

// === Institutions ===
export interface InstitutionSummary extends Identifiable {
  name: string;
  type: "university" | "college" | "institute";
  region: string;
  city: string;
  enrollment: number;
  retentionRate: number;
  graduationRate: number;
  complianceScore: number;
  complianceStatus: ComplianceStatus;
  placementRate: number;
  facultyStudentRatio: number;
  researchOutput: number;
  ranking: number;
  accreditationStatus: "accredited" | "provisional" | "under_review" | "expired";
}

export interface InstitutionDetail extends InstitutionSummary {
  established: number;
  website: string;
  chancellor: string;
  departments: number;
  programs: number;
  budget: number;
  enrollmentHistory: { year: number; count: number }[];
  performanceTrend: { year: number; retention: number; graduation: number; placement: number }[];
  complianceHistory: { date: string; score: number }[];
  departmentBreakdown: { name: string; enrollment: number; faculty: number; researchOutput: number }[];
  recentDeviations: { description: string; severity: RiskLevel; date: string; resolved: boolean }[];
}

// === Compliance ===
export interface MinistryCompliance {
  nationalScore: number;
  byInstitution: { id: string; name: string; score: number; status: ComplianceStatus; deviations: number }[];
  byFramework: { framework: string; avgScore: number; institutions: number; compliant: number }[];
  recentDeviations: {
    id: string;
    institution: string;
    description: string;
    severity: RiskLevel;
    date: string;
    resolved: boolean;
  }[];
  trend: { month: string; score: number }[];
}

// === Policy Simulation ===
export interface SimulationConfig {
  scenarioName: string;
  type: "budget" | "hiring" | "enrollment" | "policy";
  parameters: Record<string, number | string>;
  timeHorizonYears: number;
}

export interface SimulationResult extends Identifiable, Timestamps {
  scenarioName: string;
  type: SimulationConfig["type"];
  parameters: Record<string, number | string>;
  projections: { year: number; metrics: Record<string, number> }[];
  insights: string[];
  confidence: number;
  status: "running" | "completed" | "failed";
}

// === Scenarios ===
export interface ScenarioComparison {
  scenarios: SimulationResult[];
  differentials: {
    metricName: string;
    values: { scenarioId: string; scenarioName: string; value: number }[];
  }[];
}

// === Reports ===
export interface MinistryReport extends Identifiable, Timestamps {
  title: string;
  type: "national" | "regional" | "institutional" | "compliance" | "budget";
  status: "generating" | "completed" | "failed";
  generatedBy: string;
  downloadUrl?: string;
  fileSize?: number;
  parameters: Record<string, string>;
}

// === Quality ===
export interface QualityIndicator {
  institutionId: string;
  institutionName: string;
  region: string;
  facultyRatio: number;
  researchOutput: number;
  placementRate: number;
  studentSatisfaction: number;
  accreditationStatus: string;
  overallScore: number;
}

// === Budget ===
export interface MinistryBudget {
  totalBudget: number;
  allocated: number;
  utilized: number;
  utilizationRate: number;
  byInstitution: { id: string; name: string; allocated: number; utilized: number }[];
  byCategory: { category: string; amount: number; percentage: number }[];
  yearlyTrend: { year: number; budget: number; utilized: number }[];
  projections: { year: number; projected: number; lower: number; upper: number }[];
}

// === Settings ===
export interface MinistrySettings {
  dashboardPreferences: {
    defaultView: "overview" | "compliance" | "budget";
    refreshInterval: number;
    showAllInstitutions: boolean;
  };
  dataAccess: {
    anonymizeStudentData: boolean;
    requireApprovalForExport: boolean;
    dataRetentionYears: number;
  };
  notifications: {
    complianceAlerts: boolean;
    budgetAlerts: boolean;
    institutionUpdates: boolean;
    weeklyDigest: boolean;
  };
}
