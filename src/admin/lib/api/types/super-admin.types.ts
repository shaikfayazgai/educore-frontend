import type { Identifiable, Timestamps } from "./common.types";

// === Dashboard ===
export interface SuperAdminDashboard {
  totalUniversities: number;
  activeUniversities: number;
  suspendedUniversities: number;
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
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

// === Universities ===
export interface University extends Identifiable, Timestamps {
  name: string;
  shortName: string;
  domain: string;
  city: string;
  country: string;
  status: "active" | "suspended";
  adminEmail: string;
  adminName: string;
  userCount: number;
  studentCount: number;
  facultyCount: number;
}

export interface CreateUniversityRequest {
  name: string;
  shortName: string;
  domain: string;
  city: string;
  country: string;
  adminEmail: string;
  adminName: string;
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
  action: "create_university" | "suspend_university" | "reactivate_university" | "update_settings" | "login" | "logout";
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
  slackWebhookUrl: string;
}
