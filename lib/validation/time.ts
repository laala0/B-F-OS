import { z } from "zod";

export const NO_PROJECT = "__none__";

export const clockInSchema = z.object({
  projectId: z.string().optional(),
});
export type ClockInInput = z.infer<typeof clockInSchema>;

export const clockOutSchema = z.object({
  notes: z.string().trim().optional(),
});
export type ClockOutInput = z.infer<typeof clockOutSchema>;

export const adjustTimeEntrySchema = z.object({
  clockIn: z.string().min(1, "Clock in time is required"),
  clockOut: z.string().optional(),
  notes: z.string().trim().optional(),
});
export type AdjustTimeEntryInput = z.infer<typeof adjustTimeEntrySchema>;
