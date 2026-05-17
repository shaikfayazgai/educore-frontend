import { z } from "zod";

export const createUniversitySchema = z.object({
  name: z
    .string()
    .min(1, "University name is required")
    .min(3, "Name must be at least 3 characters"),
  shortName: z
    .string()
    .min(1, "Short name is required")
    .min(2, "Short name must be at least 2 characters"),
  domain: z.string().min(1, "Domain is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  adminEmail: z
    .string()
    .min(1, "Admin email is required")
    .email("Invalid email"),
  adminName: z.string().min(1, "Admin name is required"),
});

export type CreateUniversityFormData = z.infer<typeof createUniversitySchema>;

