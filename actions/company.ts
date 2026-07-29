"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import { companySchema, type CompanyInput } from "@/lib/validation/company";

function toNullable(s: string | undefined): string | null {
  return s && s.trim().length > 0 ? s.trim() : null;
}

export async function updateCompany(input: CompanyInput): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name: v.name,
      legal_name: toNullable(v.legalName),
      gst_number: toNullable(v.gstNumber),
      address: toNullable(v.address),
      timezone: v.timezone,
      default_holdback_pct: Number(v.defaultHoldbackPct),
    })
    .eq("id", user.profile.company_id);

  if (error) return actionError("Couldn't save changes.");

  revalidatePath("/settings");
  return actionOk(undefined);
}
