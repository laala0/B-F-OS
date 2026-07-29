import { z } from "zod";

export const PROJECT_STATUSES = [
  "lead",
  "quoted",
  "won",
  "active",
  "on_hold",
  "complete",
  "archived",
] as const;

const optionalText = z.string().trim().optional();

// Kept string-in/string-out (no zod .transform()) on purpose: the form
// fields are plain strings, and react-hook-form's default values / field
// types need to match the schema's *input* shape. If this used .transform()
// to turn contractValue into a number, z.infer would give the *output*
// type — a mismatch that either breaks the build or silently feeds wrong
// types to the form. The dollars-as-string -> cents conversion happens in
// actions/projects.ts, right before the DB write, not here.
export const projectSchema = z.object({
  code: z.string().trim().min(1, "Job code is required").max(64),
  name: z.string().trim().min(1, "Project name is required").max(200),
  clientName: optionalText,
  gcCompany: optionalText,
  siteAddress: optionalText,
  status: z.enum(PROJECT_STATUSES),
  contractValue: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Enter a valid amount"
    ),
  startDate: optionalText,
  targetEndDate: optionalText,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const updateProjectStatusSchema = z.object({
  status: z.enum(PROJECT_STATUSES),
});
export type UpdateProjectStatusInput = z.infer<
  typeof updateProjectStatusSchema
>;

export const assignEmployeeSchema = z.object({
  profileId: z.string().uuid("Pick an employee"),
});
export type AssignEmployeeInput = z.infer<typeof assignEmployeeSchema>;
