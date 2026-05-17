import { z } from "zod";

export const createInterventionSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  type: z.enum(
    [
      "academic_support",
      "counseling",
      "mentoring",
      "schedule_adjustment",
      "financial_aid",
    ],
    { error: "Please select an intervention type" }
  ),
  description: z
    .string()
    .min(1, "Description is required")
    .min(20, "Description must be at least 20 characters"),
  goals: z
    .array(z.string().min(1))
    .min(1, "At least one goal is required"),
  startDate: z.string().min(1, "Start date is required"),
});

export type CreateInterventionFormData = z.infer<typeof createInterventionSchema>;

export const updateInterventionSchema = z.object({
  status: z.enum(["planned", "active", "completed", "abandoned"]).optional(),
  outcomes: z.string().optional(),
  note: z.string().optional(),
});

export type UpdateInterventionFormData = z.infer<typeof updateInterventionSchema>;

export const facultyProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  officeHours: z.string().optional(),
  office: z.string().optional(),
  researchInterests: z.array(z.string()),
  expertise: z.array(z.string()),
});

export type FacultyProfileFormData = z.infer<typeof facultyProfileSchema>;
