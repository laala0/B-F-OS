"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import {
  createInviteSchema,
  updateProfileSchema,
  updateProfileRoleSchema,
  employmentRecordSchema,
  type CreateInviteInput,
  type UpdateProfileInput,
  type EmploymentRecordInput,
} from "@/lib/validation/crew";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

function toNullable(s: string | undefined): string | null {
  return s && s.trim().length > 0 ? s.trim() : null;
}

function toCents(dollars: string | undefined): number | null {
  if (!dollars || dollars.trim() === "") return null;
  return Math.round(Number(dollars) * 100);
}

// Returns the token so the UI can build a shareable /accept-invite/[token]
// link — there's no transactional email sending configured (see
// README/SMTP notes), so the admin copies or texts/emails the link
// themselves rather than the app sending it automatically.
export async function createInvite(
  input: CreateInviteInput
): Promise<ActionResult<{ token: string }>> {
  const user = await requireRole("admin");
  const parsed = createInviteSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", user.profile.company_id)
    .eq("email", v.email)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingProfile) {
    return actionError("Someone with that email is already on your crew.");
  }

  const { data, error } = await supabase
    .from("invites")
    .insert({
      company_id: user.profile.company_id,
      email: v.email,
      phone: toNullable(v.phone),
      role: v.role,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error || !data) {
    if (isUniqueViolation(error)) {
      return actionError("There's already a pending invite for that email.");
    }
    return actionError("Couldn't create the invite.");
  }

  await supabase.rpc("record_activity", {
    p_project_id: null,
    p_event_type: "crew_invited",
    p_description: `${user.profile.first_name} invited ${v.email} as ${v.role}`,
  });

  revalidatePath("/crew");
  return actionOk({ token: data.token });
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .is("accepted_at", null);

  if (error) return actionError("Couldn't revoke that invite.");

  revalidatePath("/crew");
  return actionOk(undefined);
}

export async function updateProfile(
  profileId: string,
  input: UpdateProfileInput
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: v.firstName,
      last_name: v.lastName,
      phone: toNullable(v.phone),
    })
    .eq("id", profileId);

  if (error) return actionError("Couldn't save changes.");

  revalidatePath(`/crew/${profileId}`);
  revalidatePath("/crew");
  return actionOk(undefined);
}

// Guards against locking the company out of admin access entirely: you
// can't demote or suspend the last active admin, including yourself.
async function isLastActiveAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  profileId: string
): Promise<boolean> {
  const { data: target } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", profileId)
    .single();

  if (!target || target.role !== "admin" || target.status !== "active") {
    return false;
  }

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("role", "admin")
    .eq("status", "active")
    .is("deleted_at", null)
    .neq("id", profileId);

  return (count ?? 0) === 0;
}

export async function updateProfileRole(
  profileId: string,
  role: string
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = updateProfileRoleSchema.safeParse({ role });
  if (!parsed.success) return actionError("That's not a valid role.");

  const supabase = await createClient();

  if (
    parsed.data.role === "employee" &&
    (await isLastActiveAdmin(supabase, user.profile.company_id, profileId))
  ) {
    return actionError("Promote someone else to admin first — a company needs at least one.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", profileId)
    .select("first_name, last_name")
    .single();

  if (error) return actionError("Couldn't update their role.");

  await supabase.rpc("record_activity", {
    p_project_id: null,
    p_event_type: "role_changed",
    p_description: `${data.first_name} ${data.last_name} is now ${parsed.data.role === "admin" ? "an admin" : "an employee"}`,
  });

  revalidatePath(`/crew/${profileId}`);
  revalidatePath("/crew");
  return actionOk(undefined);
}

export async function suspendProfile(profileId: string): Promise<ActionResult> {
  const user = await requireRole("admin");
  const supabase = await createClient();

  if (await isLastActiveAdmin(supabase, user.profile.company_id, profileId)) {
    return actionError("Promote someone else to admin before suspending this account.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", profileId)
    .select("first_name, last_name")
    .single();

  if (error) return actionError("Couldn't suspend that account.");

  await supabase.rpc("record_activity", {
    p_project_id: null,
    p_event_type: "crew_suspended",
    p_description: `${data.first_name} ${data.last_name} was suspended`,
  });

  revalidatePath(`/crew/${profileId}`);
  revalidatePath("/crew");
  return actionOk(undefined);
}

export async function reactivateProfile(profileId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", profileId)
    .select("first_name, last_name")
    .single();

  if (error) return actionError("Couldn't reactivate that account.");

  await supabase.rpc("record_activity", {
    p_project_id: null,
    p_event_type: "crew_reactivated",
    p_description: `${data.first_name} ${data.last_name} was reactivated`,
  });

  revalidatePath(`/crew/${profileId}`);
  revalidatePath("/crew");
  return actionOk(undefined);
}

export async function updateEmploymentRecord(
  profileId: string,
  input: EmploymentRecordInput
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = employmentRecordSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("employment_records").upsert(
    {
      company_id: user.profile.company_id,
      profile_id: profileId,
      hourly_rate_cents: toCents(v.hourlyRate),
      overtime_rate_cents: toCents(v.overtimeRate),
      employment_type: v.employmentType,
      hired_on: toNullable(v.hiredOn),
      notes: toNullable(v.notes),
    },
    { onConflict: "profile_id" }
  );

  if (error) return actionError("Couldn't save wage details.");

  revalidatePath(`/crew/${profileId}`);
  return actionOk(undefined);
}
