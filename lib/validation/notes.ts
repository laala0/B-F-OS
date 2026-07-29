import { z } from "zod";

export const createNoteSchema = z.object({
  projectId: z.string().uuid("Pick a job"),
  weather: z.string().trim().optional(),
  crewCount: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "Enter a valid count"
    ),
  note: z.string().trim().min(1, "Write something before saving"),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
