export const APP_NAME = "Glimmora";
export const APP_DESCRIPTION = "Global Education Intelligence Infrastructure";

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DEBOUNCE_MS = 300;

export const RISK_LEVEL_LABELS = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
  none: "No Risk",
} as const;

export const COMPLIANCE_STATUS_LABELS = {
  compliant: "Compliant",
  at_risk: "At Risk",
  non_compliant: "Non-Compliant",
} as const;

export const PIPELINE_STAGE_LABELS = {
  matched: "Matched",
  applied: "Applied",
  interviewed: "Interviewed",
  offered: "Offered",
  placed: "Placed",
  rejected: "Rejected",
} as const;

export const APPEAL_STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  info_requested: "Info Requested",
  resolved: "Resolved",
  rejected: "Rejected",
  escalated: "Escalated",
} as const;

export const INTERVENTION_STATUS_LABELS = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  abandoned: "Abandoned",
} as const;
