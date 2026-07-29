import { z } from "zod";

export const ROLES = ["admin", "employee"] as const;

export const createInviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional(),
  role: z.enum(ROLES),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateProfileRoleSchema = z.object({
  role: z.enum(ROLES),
});
export type UpdateProfileRoleInput = z.infer<typeof updateProfileRoleSchema>;

const optionalDollars = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
    "Enter a valid amount"
  );

export const EMPLOYMENT_TYPES = ["hourly", "salary", "contract"] as const;

export const employmentRecordSchema = z.object({
  hourlyRate: optionalDollars,
  overtimeRate: optionalDollars,
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hiredOn: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
export type EmploymentRecordInput = z.infer<typeof employmentRecordSchema>;
