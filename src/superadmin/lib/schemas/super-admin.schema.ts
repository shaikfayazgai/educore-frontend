import { z } from "zod";

export const universityTypeEnum = z.enum([
  "govt_central",
  "state",
  "private",
  "others",
]);

export const createUniversitySchema = z
  .object({
  name: z
    .string()
    .min(1, "University name is required")
    .min(3, "Name must be at least 3 characters"),
  shortName: z
    .string()
    .min(1, "Short name is required")
    .min(2, "Short name must be at least 2 characters"),
  universityCode: z
    .string()
    .trim()
    .min(2, "University code must be at least 2 characters")
    .max(10, "University code cannot exceed 10 characters")
    .regex(/^[a-zA-Z0-9]+$/, "University code must be alphanumeric"),
  universityType: universityTypeEnum,
  domain: z.string().min(1, "Domain is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  countryCode: z.string().optional(),
  adminEmail: z
    .string()
    .min(1, "Admin email is required")
    .email("Invalid email"),
  adminName: z.string().min(1, "Admin name is required"),
  adminPhone: z
    .string()
    .min(1, "Phone number is required")
    .refine((v) => v.replace(/\D/g, "").length >= 7, {
      message: "Enter a valid phone number",
    }),
  adminDesignation: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]),
  })
  .superRefine((data, ctx) => {
    // When a phone number is provided, the dial code must be picked too —
    // otherwise the saved value is meaningless without country context.
    if (data.adminPhone && data.adminPhone.trim() && !data.countryCode) {
      ctx.addIssue({
        code: "custom",
        path: ["countryCode"],
        message: "Select a country dial code",
      });
    }
  });

export type CreateUniversityFormData = z.infer<typeof createUniversitySchema>;

export const createMinistrySchema = z.object({
  name: z.string().min(1, "Ministry name is required"),
  country: z.string().min(1, "Country is required"),
  contactEmail: z
    .string()
    .min(1, "Contact email is required")
    .email("Invalid email"),
  contactName: z.string().min(1, "Contact name is required"),
});

export type CreateMinistryFormData = z.infer<typeof createMinistrySchema>;
