import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  role: z.enum(
    ["student", "faculty", "admin", "research", "placement", "ministry"],
    { error: "Please select a role" }
  ),
  department: z.string().min(1, "Department is required"),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z
    .enum(["student", "faculty", "admin", "research", "placement", "ministry"])
    .optional(),
  department: z.string().min(1).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export const issueCredentialSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters"),
  type: z.enum(["degree", "certificate", "badge", "transcript"], {
    error: "Please select a type",
  }),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters"),
});

export type IssueCredentialFormData = z.infer<typeof issueCredentialSchema>;

export const revokeCredentialSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason is required")
    .min(10, "Please provide a detailed reason (at least 10 characters)"),
});

export type RevokeCredentialFormData = z.infer<typeof revokeCredentialSchema>;

export const institutionSettingsSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  shortName: z.string().min(1, "Short name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  locale: z.string().min(1, "Locale is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  primaryColor: z.string().min(1, "Primary color is required"),
  visibility: z.object({
    shareWithMinistry: z.boolean(),
    anonymizeData: z.boolean(),
    publicProfile: z.boolean(),
  }),
  dataRetention: z.object({
    studentRecords: z.number().min(1, "Must be at least 1 year"),
    auditLogs: z.number().min(1, "Must be at least 1 year"),
    analyticsData: z.number().min(1, "Must be at least 1 year"),
  }),
});

export type InstitutionSettingsFormData = z.infer<typeof institutionSettingsSchema>;

export const resolveDeviationSchema = z.object({
  resolution: z
    .string()
    .min(1, "Resolution is required")
    .min(10, "Please describe how this deviation was resolved"),
});

export type ResolveDeviationFormData = z.infer<typeof resolveDeviationSchema>;
