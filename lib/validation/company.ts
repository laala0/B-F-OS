import { z } from "zod";

const optionalText = z.string().trim().optional();

export const CANADIAN_TIMEZONES = [
  "America/Vancouver",
  "America/Edmonton",
  "America/Regina",
  "America/Winnipeg",
  "America/Toronto",
  "America/Halifax",
  "America/St_Johns",
] as const;

export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  legalName: optionalText,
  gstNumber: optionalText,
  address: optionalText,
  timezone: z.enum(CANADIAN_TIMEZONES),
  defaultHoldbackPct: z
    .string()
    .refine(
      (v) => v.trim() !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100,
      "Enter a percentage between 0 and 100"
    ),
});
export type CompanyInput = z.infer<typeof companySchema>;
