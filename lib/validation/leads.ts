import { z } from "zod";

export const LEAD_ROLES = ["Engineer", "Strata manager", "Strata council", "Owner", "Builder", "Other"] as const;

export const submitLeadSchema = z.object({
  name: z.string().trim().min(2, "Please add your name.").max(120),
  role: z.enum(LEAD_ROLES),
  organization: z.string().trim().max(160).optional(),
  email: z.string().trim().email("That email doesn't look right.").max(160),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  problem: z.string().trim().min(10, "Tell us a little about the problem.").max(4000),
  // Hidden from people. Only bots fill it in.
  website: z.string().max(0).optional(),
});
export type SubmitLeadInput = z.infer<typeof submitLeadSchema>;
