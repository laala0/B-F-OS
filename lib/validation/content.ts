import { z } from "zod";

export const CONTENT_STAGES = [
  "lead",
  "excavation",
  "base_prep",
  "forming",
  "rebar",
  "pour",
  "concrete_finish",
  "framing",
  "drywall",
  "tape_paint",
  "bath_kitchen",
  "landscape",
  "repair",
  "other",
] as const;

export const STAGE_LABELS: Record<(typeof CONTENT_STAGES)[number], string> = {
  lead: "Lead (development sign)",
  excavation: "Excavation",
  base_prep: "Base prep",
  forming: "Forming",
  rebar: "Rebar",
  pour: "Pour",
  concrete_finish: "Concrete finish",
  framing: "Framing",
  drywall: "Drywall",
  tape_paint: "Tape and paint",
  bath_kitchen: "Bath and kitchen",
  landscape: "Landscape",
  repair: "Repair",
  other: "Other",
};

export const CONTENT_BRANDS = ["f2f", "bfc", "experience", "unsorted"] as const;

export const BRAND_LABELS: Record<(typeof CONTENT_BRANDS)[number], string> = {
  f2f: "Form2Finish",
  bfc: "Boss & Friends",
  experience: "Past experience",
  unsorted: "Not sure yet",
};

export const reviewPhotoSchema = z.object({
  assetId: z.string().uuid(),
  action: z.enum(["keep", "skip"]),
  stage: z.enum(CONTENT_STAGES).optional(),
  brand: z.enum(CONTENT_BRANDS).optional(),
  jobSiteId: z.string().uuid().optional(),
  publicOk: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type ReviewPhotoInput = z.infer<typeof reviewPhotoSchema>;

export const decidePostSchema = z.discriminatedUnion("action", [
  z.object({ postId: z.string().uuid(), action: z.literal("approve") }),
  z.object({ postId: z.string().uuid(), action: z.literal("edit"), caption: z.string().trim().min(1).max(5000) }),
  z.object({ postId: z.string().uuid(), action: z.literal("reject"), feedback: z.string().trim().max(1000).optional() }),
]);
export type DecidePostInput = z.infer<typeof decidePostSchema>;

export const updateJobSiteSchema = z.object({
  jobSiteId: z.string().uuid(),
  address: z.string().trim().max(200).optional(),
  performedBy: z.string().trim().max(120).optional(),
  confirmed: z.boolean(),
});
export type UpdateJobSiteInput = z.infer<typeof updateJobSiteSchema>;
