import type { Identifiable, Timestamps } from "./common.types";

// === Dashboard ===
export interface SuperAdminDashboard {
  totalUniversities: number;
  activeUniversities: number;
  suspendedUniversities: number;
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  /** Platform-wide count of placement-officer accounts across active tenants. */
  totalPlacement: number;
  universityGrowth: { month: string; count: number }[];
  recentOnboardings: RecentOnboarding[];
}

export interface RecentOnboarding {
  id: string;
  universityName: string;
  adminName: string;
  adminEmail: string;
  createdAt: string;
  userCount: number;
}

export type UniversityType = "govt_central" | "state" | "private" | "others";

// === Universities ===
export interface University extends Identifiable, Timestamps {
  name: string;
  shortName: string;
  universityCode: string;
  domain: string;
  city: string;
  state?: string;
  pinCode?: string;
  country: string;
  /** ISO country dial code, e.g. "+91" (display only — for phone prefix). */
  countryCode?: string;
  universityType: UniversityType;
  status: "active" | "inactive" | "suspended";
  /** Reason captured when the tenant was suspended. */
  suspensionComment?: string;
  suspendedAt?: string | null;
  adminEmail: string;
  adminName: string;
  adminPhone?: string;
  adminDesignation?: string;
  userCount: number;
  studentCount: number;
  facultyCount: number;
  /** Live count of role='placement' accounts under this tenant. */
  placementCount: number;
  /** Live count of role='research' accounts under this tenant. */
  researchCount: number;
  /** Legacy — kept for backward compat. New flow auto-activates without OTP. */
  invitationVerifiedAt?: string | null;
  previousInvitationVerifiedAt?: string | null;
  lastInviteOtpSentAt?: string | null;
}

/** Tenant in trash; permanently removed after `daysUntilPermanentDelete` reaches 0. */
export interface TrashedUniversity extends University {
  deletedAt: string;
  permanentDeleteAt: string;
  daysUntilPermanentDelete: number;
}

export interface CreateUniversityRequest {
  name: string;
  shortName: string;
  universityCode: string;
  domain: string;
  city: string;
  state?: string;
  pinCode?: string;
  country: string;
  countryCode?: string;
  universityType: UniversityType;
  adminEmail: string;
  adminName: string;
  adminPhone?: string;
  adminDesignation?: string;
}

// === Monitoring ===
export interface PlatformMonitoring {
  systemStatus: "healthy" | "degraded" | "down";
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
  activeUsers24h: number;
  storageUsed: number;
  storageTotal: number;
  services: ServiceStatus[];
  responseTimeTrend: { time: string; ms: number }[];
  errorTrend: { time: string; count: number }[];
}

export interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  uptime: number;
  lastChecked: string;
}

// === Audit Log ===
export interface PlatformAuditEntry extends Identifiable {
  timestamp: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action:
    | "create_university"
    | "suspend_university"
    | "reactivate_university"
    | "trash_university"
    | "restore_university"
    | "export_university_trash"
    | "purge_university_trash"
    | "invite_otp_sent"
    | "invite_otp_verified"
    | "permanent_delete_university"
    | "update_settings"
    | "login"
    | "logout";
  target: string;
  targetId: string;
  details: string;
  ipAddress: string;
}

// === Settings ===
export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  maxUniversities: number;
  maxUsersPerUniversity: number;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultTimezone: string;
  dataRetentionYears: number;
  emailNotifications: boolean;
  sessionSingleActiveEnabled?: boolean;
  slackWebhookUrl: string;
  /** When true, auditLogRetentionDays-old entries are auto-purged on each list. */
  auditLogAutoDelete: boolean;
  /** Days to retain audit entries before auto-purge runs. */
  auditLogRetentionDays: number;
}

export interface WebhookTestResult {
  ok: boolean;
  statusCode: number;
  latencyMs: number;
  message: string;
  response?: string;
}

export interface EmailTemplate {
  key: string;
  label: string;
  description: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface UpdateEmailTemplateRequest {
  key: string;
  subject?: string;
  body?: string;
}

export interface RateLimitRule {
  name: string;
  methods: string[];
  path: string;
  scope: "exact" | "prefix";
  identity: "ip" | "user";
  limit: number;
  windowSeconds: number;
  description: string;
}

export interface SecurityFeaturesSummary {
  redisConfigured: boolean;
  redisAvailable?: boolean;
  redisStatus?: "not_configured" | "connected" | "unreachable";
  rateLimitEnabled: boolean;
  userRateLimitEnabled: boolean;
  trustProxyHeaders: boolean;
  singleActiveSessionEnabled: boolean;
  sessionWriteOwnerEnabled: boolean;
  deviceTrackingEnabled: boolean;
  bruteForceMaxAttempts: number;
  bruteForceLockMinutes: number;
  sessionTouchIntervalSeconds: number;
  rules: RateLimitRule[];
}

export interface BlockedIpEntry {
  ip: string;
  source: "config" | "redis";
  reason?: string | null;
  blockedBy?: string | null;
  blockedAt?: string | null;
  expiresAt?: string | null;
  ttlSeconds?: number | null;
}

export interface BlockIpRequest {
  ip: string;
  reason?: string;
  expiresInSeconds?: number;
}

export interface UnblockIpResponse {
  removed: boolean;
  ip: string;
}

export interface LoginSession {
  sessionId: string;
  accountId: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  deviceLabel: string;
  createdAt: string | null;
  lastSeenAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
}

export interface SecuritySessionsSummary {
  singleActiveSessionEnabled: boolean;
  sessionWriteOwnerEnabled: boolean;
  currentSessionId: string | null;
  activeSessionCount?: number;
  otherActiveSessionCount?: number;
  sessions: LoginSession[];
}

export interface SingleActiveSessionRequest {
  enabled: boolean;
  expectedValue?: boolean;
}

export interface LockedLoginAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  failedLoginAttempts: number;
  loginLockLevel: number;
  loginLockedUntil: string | null;
  lastFailedLoginAt: string | null;
  lastFailedLoginIp: string | null;
}

// ── Tenant complaints (lockout-page submissions) ────────────────────────────

export type ComplaintStatus = "open" | "in_progress" | "resolved" | "dismissed";
export type ComplaintIssueType =
  | "suspended"
  | "deactivated"
  | "activate"
  | "queries"
  | "other";

export interface TenantComplaint {
  id: string;
  tenantId: string | null;
  universityCode: string | null;
  universityName: string | null;
  adminEmail: string;
  adminName: string;
  issueType: ComplaintIssueType;
  issueDate: string;
  comment: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  seenBySuperAdmin: boolean;
}

export interface ComplaintCounts {
  open: number;
  inProgress: number;
  resolved: number;
  dismissed: number;
  total: number;
}
