import { z } from "zod";

export const facultyProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  officeHours: z.string().optional(),
  office: z.string().optional(),
  expertise: z.array(z.string()),
});

export type FacultyProfileFormData = z.infer<typeof facultyProfileSchema>;

// === LMS Schemas ===

export const createModuleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  description: z.string().min(1, "Description is required"),
});

export type CreateModuleFormData = z.infer<typeof createModuleSchema>;

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["assignment", "project"]),
  dueDate: z.string().min(1, "Due date is required"),
  maxScore: z.number().min(1, "Max score must be at least 1"),
  weight: z.number().min(1).max(100, "Weight must be 1-100"),
});

export type CreateAssignmentFormData = z.infer<typeof createAssignmentSchema>;

export const gradeSubmissionSchema = z.object({
  score: z.number().min(0, "Score cannot be negative"),
  feedback: z.string().min(1, "Feedback is required"),
});

export type GradeSubmissionFormData = z.infer<typeof gradeSubmissionSchema>;

export const createAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  topic: z.string().min(1, "Topic is required"),
});

export type CreateAttendanceFormData = z.infer<typeof createAttendanceSchema>;
