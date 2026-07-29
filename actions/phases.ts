"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import { phaseSchema, type PhaseInput } from "@/lib/validation/phases";

function toNullable(s: string | undefined): string | null {
  return s && s.trim().length > 0 ? s.trim() : null;
}

export async function createPhase(
  projectId: string,
  input: PhaseInput
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = phaseSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { count } = await supabase
    .from("project_phases")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { error } = await supabase.from("project_phases").insert({
    company_id: user.profile.company_id,
    project_id: projectId,
    name: v.name,
    status: v.status,
    planned_start: toNullable(v.plannedStart),
    planned_end: toNullable(v.plannedEnd),
    actual_start: toNullable(v.actualStart),
    actual_end: toNullable(v.actualEnd),
    position: count ?? 0,
  });

  if (error) return actionError("Couldn't add that phase.");

  revalidatePath(`/projects/${projectId}`);
  return actionOk(undefined);
}

export async function updatePhase(
  phaseId: string,
  projectId: string,
  input: PhaseInput
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = phaseSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_phases")
    .update({
      name: v.name,
      status: v.status,
      planned_start: toNullable(v.plannedStart),
      planned_end: toNullable(v.plannedEnd),
      actual_start: toNullable(v.actualStart),
      actual_end: toNullable(v.actualEnd),
    })
    .eq("id", phaseId);

  if (error) return actionError("Couldn't save changes.");

  revalidatePath(`/projects/${projectId}`);
  return actionOk(undefined);
}

export async function deletePhase(
  phaseId: string,
  projectId: string
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("project_phases").delete().eq("id", phaseId);

  if (error) return actionError("Couldn't delete that phase.");

  revalidatePath(`/projects/${projectId}`);
  return actionOk(undefined);
}

export async function movePhase(
  phaseId: string,
  projectId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: phases } = await supabase
    .from("project_phases")
    .select("id, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (!phases) return actionError("Couldn't reorder phases.");

  const index = phases.findIndex((p) => p.id === phaseId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= phases.length) {
    return actionOk(undefined);
  }

  const a = phases[index];
  const b = phases[swapWith];

  const [{ error: errorA }, { error: errorB }] = await Promise.all([
    supabase.from("project_phases").update({ position: b.position }).eq("id", a.id),
    supabase.from("project_phases").update({ position: a.position }).eq("id", b.id),
  ]);

  if (errorA || errorB) return actionError("Couldn't reorder phases.");

  revalidatePath(`/projects/${projectId}`);
  return actionOk(undefined);
}
