import { z } from "zod";

export const PHASE_STATUSES = ["not_started", "in_progress", "complete"] as const;

const optionalDate = z.string().trim().optional();

export const phaseSchema = z.object({
  name: z.string().trim().min(1, "Phase name is required").max(200),
  status: z.enum(PHASE_STATUSES),
  plannedStart: optionalDate,
  plannedEnd: optionalDate,
  actualStart: optionalDate,
  actualEnd: optionalDate,
});
export type PhaseInput = z.infer<typeof phaseSchema>;
