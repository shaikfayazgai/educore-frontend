export type PortalRole =
  | "super_admin"
  | "student"
  | "faculty"
  | "admin"
  | "placement";

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Identifiable {
  id: string;
}

export interface TenantScoped {
  tenantId: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  search?: string;
  [key: string]: string | string[] | number | boolean | undefined;
}

export type RiskLevel = "high" | "medium" | "low" | "none";
export type AppealStatus = "pending" | "under_review" | "info_requested" | "resolved" | "rejected" | "escalated";
export type MatchStatus = "pending" | "approved" | "rejected";
export type PipelineStage =
  | "matched"
  | "applied"
  | "interviewed"
  | "offered"
  | "placed"
  | "rejected";
export type ComplianceStatus = "compliant" | "at_risk" | "non_compliant";
export type CredentialStatus =
  | "active"
  | "revoked"
  | "expired"
  | "pending_verification";
export type IntegrationHealth = "healthy" | "degraded" | "down";
export type InterventionStatus =
  | "planned"
  | "active"
  | "completed"
  | "abandoned";
export type GrantStatus =
  | "discovered"
  | "interested"
  | "drafting"
  | "submitted"
  | "funded"
  | "rejected";
export type ModelStatus = "active" | "inactive" | "training" | "deprecated";
