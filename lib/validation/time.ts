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

// Admin-entered shift for someone who couldn't clock in themselves (no signal
// in a parkade, dead battery, forgot). Unlike clockIn/clockOut this records a
// shift that's already over, so clockOut is required — an admin-created "open"
// shift would also collide with idx_time_entries_one_open_per_profile if that
// person is currently clocked in for real.
export const createTimeEntrySchema = z.object({
  profileId: z.string().uuid("Pick a crew member"),
  projectId: z.string().optional(),
  clockIn: z.string().min(1, "Clock in time is required"),
  clockOut: z.string().min(1, "Clock out time is required"),
  notes: z.string().trim().optional(),
});
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
