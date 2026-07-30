"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import {
  clockInSchema,
  clockOutSchema,
  adjustTimeEntrySchema,
  createTimeEntrySchema,
  NO_PROJECT,
  type ClockInInput,
  type ClockOutInput,
  type AdjustTimeEntryInput,
  type CreateTimeEntryInput,
} from "@/lib/validation/time";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

function toNullable(s: string | undefined): string | null {
  return s && s.trim().length > 0 ? s.trim() : null;
}

export async function clockIn(input: ClockInInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = clockInSchema.safeParse(input);
  if (!parsed.success) return actionError("Couldn't clock you in.");

  const projectId =
    parsed.data.projectId && parsed.data.projectId !== NO_PROJECT
      ? parsed.data.projectId
      : null;

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    company_id: user.profile.company_id,
    profile_id: user.id,
    project_id: projectId,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return actionError("You're already clocked in.");
    }
    return actionError("Couldn't clock you in.");
  }

  await supabase.rpc("record_activity", {
    p_project_id: projectId,
    p_event_type: "clock_in",
    p_description: `${user.profile.first_name} clocked in`,
  });

  revalidatePath("/today");
  return actionOk(undefined);
}

export async function clockOut(
  entryId: string,
  input: ClockOutInput
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = clockOutSchema.safeParse(input);
  if (!parsed.success) return actionError("Couldn't clock you out.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .update({
      clock_out: new Date().toISOString(),
      notes: toNullable(parsed.data.notes),
    })
    .eq("id", entryId)
    .eq("profile_id", user.id)
    .select("project_id")
    .single();

  if (error) return actionError("Couldn't clock you out.");

  await supabase.rpc("record_activity", {
    p_project_id: data?.project_id ?? null,
    p_event_type: "clock_out",
    p_description: `${user.profile.first_name} clocked out`,
  });

  revalidatePath("/today");
  revalidatePath("/timesheets");
  return actionOk(undefined);
}

export async function approveTimeEntry(entryId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({ status: "approved" })
    .eq("id", entryId);

  if (error) return actionError("Couldn't approve that entry.");

  revalidatePath("/timesheets");
  return actionOk(undefined);
}

export async function rejectTimeEntry(entryId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({ status: "rejected" })
    .eq("id", entryId);

  if (error) return actionError("Couldn't reject that entry.");

  revalidatePath("/timesheets");
  return actionOk(undefined);
}

// The escape hatch for hours the app never captured: no signal in an
// underground parkade, dead phone, or someone who just forgot. Without this,
// those hours can only reach the boss by text — which is the exact workflow
// the app is supposed to replace, so the app loses either way.
//
// Lands as "pending" rather than "approved" so a manually-typed shift still
// shows up in the same review queue as a real clock-in and gets an explicit
// approval, instead of quietly counting toward payroll on one person's word.
export async function createTimeEntry(
  input: CreateTimeEntryInput
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = createTimeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;
  const clockIn = new Date(v.clockIn);
  const clockOut = new Date(v.clockOut);

  if (clockOut <= clockIn) {
    return actionError("Clock out must be after clock in.", {
      clockOut: ["Must be after clock in"],
    });
  }

  const projectId =
    v.projectId && v.projectId !== NO_PROJECT ? v.projectId : null;

  const supabase = await createClient();
  // profile_id is trusted from the form here (unlike clockIn, which derives
  // it from auth.uid()) — that's what makes this an admin-only action. The
  // composite FK on (profile_id, company_id) still stops an admin from
  // logging hours against someone in another company.
  const { error } = await supabase.from("time_entries").insert({
    company_id: user.profile.company_id,
    profile_id: v.profileId,
    project_id: projectId,
    clock_in: clockIn.toISOString(),
    clock_out: clockOut.toISOString(),
    status: "pending",
    notes: toNullable(v.notes),
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return actionError("That person already has an open shift running.");
    }
    return actionError("Couldn't add that entry.");
  }

  await supabase.rpc("record_activity", {
    p_project_id: projectId,
    p_event_type: "time_entry_added",
    p_description: `${user.profile.first_name} added a time entry by hand`,
  });

  revalidatePath("/timesheets");
  return actionOk(undefined);
}

// Admin correction (wrong clock-in time, forgot to clock out, etc.) — sets
// it back to "pending" so it goes through approval again rather than
// silently staying approved/rejected against edited numbers.
export async function adjustTimeEntry(
  entryId: string,
  input: AdjustTimeEntryInput
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = adjustTimeEntrySchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;
  const clockIn = new Date(v.clockIn);
  const clockOut = v.clockOut ? new Date(v.clockOut) : null;

  if (clockOut && clockOut <= clockIn) {
    return actionError("Clock out must be after clock in.", {
      clockOut: ["Must be after clock in"],
    });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({
      clock_in: clockIn.toISOString(),
      clock_out: clockOut ? clockOut.toISOString() : null,
      notes: toNullable(v.notes),
      status: clockOut ? "pending" : "open",
    })
    .eq("id", entryId);

  if (error) return actionError("Couldn't save changes.");

  revalidatePath("/timesheets");
  return actionOk(undefined);
}
