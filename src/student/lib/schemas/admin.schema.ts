import { z } from "zod";

export const createUserSchema = z.object({
  // Admin role intentionally excluded — Super Admin onboards University Admins,
  // not the University Admin themselves.
  role: z.enum(
    ["student", "faculty", "placement"],
    { error: "Please select a role" }
  ),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  department: z.string().min(1, "Specialization is required"),
  // Student-specific
  studentId: z.string().optional(),
  program: z.string().optional(),
  academicYearStart: z.string().optional(),
  academicYearEnd: z.string().optional(),
  currentSemester: z.string().optional(),
  // Faculty-specific
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  specialization: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const createProgramSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  department: z.string().min(1, "Specialization is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 year").max(8),
  totalSemesters: z.coerce.number().min(1, "Must have at least 1 semester").max(16),
  degreeType: z.enum(["UG", "PG", "Diploma", "PhD"], { error: "Please select a degree type" }),
});

export type CreateProgramFormData = z.output<typeof createProgramSchema>;
export type CreateProgramFormInput = z.input<typeof createProgramSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z
    .enum(["student", "faculty", "admin", "placement"])
    .optional(),
  department: z.string().min(1).optional(),
  status: z
    .enum(["active", "inactive", "suspended", "pending_invitation"])
    .optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

// Full edit form for the user detail page. All fields a University Admin
// can change in a single edit session — name, contact, role, dept, plus
// the role-specific fields. Status is a quick action elsewhere, not a form
// field. studentId / employeeId are immutable and not edited here.
export const editUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  phone: z.string().optional(),
  department: z.string().min(1, "Specialization is required"),
  role: z.enum(["student", "faculty", "admin", "placement"]),
  // Student-specific
  program: z.string().optional(),
  academicYearStart: z.string().optional(),
  academicYearEnd: z.string().optional(),
  currentSemester: z.string().optional(),
  // Faculty-specific
  designation: z.string().optional(),
  specialization: z.string().optional(),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;

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

export const createCourseSchema = z.object({
  code: z.string().min(1, "Course code is required"),
  name: z.string().min(1, "Course name is required"),
  description: z.string().min(1, "Description is required"),
  credits: z.coerce.number().min(1, "Credits must be at least 1").max(12),
  department: z.string().min(1, "Specialization is required"),
  semesterId: z.string().min(1, "Semester is required"),
  facultyId: z.string().min(1, "Faculty is required"),
  maxCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

export type CreateCourseFormData = z.output<typeof createCourseSchema>;
export type CreateCourseFormInput = z.input<typeof createCourseSchema>;

// === Course Catalog (design-time master row) ===
export const createCatalogSchema = z.object({
  code: z
    .string()
    .min(1, "Course code is required")
    .max(12, "Course code too long")
    .regex(/^[A-Z0-9-]+$/, { error: "Use uppercase letters, digits, and hyphens only" }),
  name: z.string().min(1, "Course name is required"),
  description: z.string().min(1, "Description is required"),
  syllabus: z
    .string()
    .min(20, "Syllabus must be at least 20 characters — list the topics covered"),
  regulation: z
    .string()
    .min(1, "Regulation is required (e.g. R22, R20)")
    .max(8, "Keep regulation short (e.g. R22)"),
  credits: z.coerce.number().min(1, "Credits must be at least 1").max(12),
  courseType: z.enum(["core", "programme_elective", "open_elective"], {
    error: "Pick a course type",
  }),
  owningDepartmentId: z.string().nullable(),
  lectureHours: z.coerce.number().min(0, "Cannot be negative").max(10),
  tutorialHours: z.coerce.number().min(0, "Cannot be negative").max(10),
  practicalHours: z.coerce.number().min(0, "Cannot be negative").max(10),
});

export type CreateCatalogFormData = z.output<typeof createCatalogSchema>;
export type CreateCatalogFormInput = z.input<typeof createCatalogSchema>;

// === Course Offering (run-time instance) ===
export const createOfferingSchema = z.object({
  catalogId: z.string().min(1, "Pick a course from the catalog"),
  academicYearId: z.string().min(1, "Select an academic year"),
  semesterId: z.string().min(1, "Select a semester"),
  studyYear: z.coerce
    .number()
    .min(1, "Study year is 1–5")
    .max(5, "Study year is 1–5") as unknown as z.ZodType<1 | 2 | 3 | 4 | 5>,
  sectionId: z.string().min(1, "Select a section"),
  // Optional: leaving faculty empty marks the offering as draft.
  facultyId: z.string().nullable().optional(),
  // Capacity is no longer a per-offering policy — anyone can enrol. We keep
  // the field on the request payload (backed by a generous fixed default in
  // the form) so the data shape stays compatible with existing handlers and
  // future admission caps if a policy ever changes.
  maxCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

export type CreateOfferingFormData = z.output<typeof createOfferingSchema>;
export type CreateOfferingFormInput = z.input<typeof createOfferingSchema>;

export const createSemesterSchema = z
  .object({
    name: z.string().min(1, "Semester name is required"),
    year: z.string().min(4, "Year is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate),
    { message: "End date must be after start date", path: ["endDate"] }
  );

export type CreateSemesterFormData = z.infer<typeof createSemesterSchema>;

export const createAcademicYearSchema = z
  .object({
    name: z.string().min(1, "Academic year name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate),
    { message: "End date must be after start date", path: ["endDate"] }
  );

export type CreateAcademicYearFormData = z.infer<typeof createAcademicYearSchema>;

export const bulkImportUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  // Admin role intentionally excluded — see createUserSchema rationale.
  role: z.enum(["student", "faculty", "placement"]),
  department: z.string().min(1, "Specialization is required"),
  studentId: z.string().optional(),
  program: z.string().optional(),
  employeeId: z.string().optional(),
});

export type BulkImportUserFormData = z.infer<typeof bulkImportUserSchema>;
