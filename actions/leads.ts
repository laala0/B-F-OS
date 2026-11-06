"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { FORM2FINISH_COMPANY_ID } from "@/lib/domain/form2finish";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import { submitLeadSchema, type SubmitLeadInput } from "@/lib/validation/leads";

// Called by the public capability sheet, so there's no session and RLS can't
// help: the admin client is the only way in. It writes one validated row and
// reads nothing back. Same pattern as bootstrap_company/accept_invite.
export async function submitLead(input: SubmitLeadInput): Promise<ActionResult> {
  const parsed = submitLeadSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please check the form.", parsed.error.flatten().fieldErrors);
  }
  const { website, ...lead } = parsed.data;
  // A filled honeypot means a bot. Look successful so it doesn't try again.
  if (website) return actionOk(undefined);

  const { error } = await createAdminClient().from("leads").insert({
    company_id: FORM2FINISH_COMPANY_ID,
    source: "capability_form",
    name: lead.name,
    role: lead.role,
    organization: lead.organization || null,
    email: lead.email,
    phone: lead.phone || null,
    city: lead.city || null,
    problem: lead.problem,
  });

  if (error) return actionError("Couldn't send that. Please try again.");
  return actionOk(undefined);
}
