"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import {
  projectSchema,
  updateProjectStatusSchema,
  assignEmployeeSchema,
  type ProjectInput,
} from "@/lib/validation/projects";

// Postgres unique_violation — used for both the (company_id, code) index on
// projects and the (project_id, profile_id) index on project_assignments.
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

export async function createProject(
  input: ProjectInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("admin");
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      company_id: user.profile.company_id,
      code: v.code,
      name: v.name,
      client_name: toNullable(v.clientName),
      gc_company: toNullable(v.gcCompany),
      site_address: toNullable(v.siteAddress),
      status: v.status,
      contract_value_cents: toCents(v.contractValue),
      start_date: toNullable(v.startDate),
      target_end_date: toNullable(v.targetEndDate),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return actionError("That job code is already in use.", {
        code: ["Already in use"],
      });
    }
    return actionError("Couldn't create the project.");
  }

  revalidatePath("/projects");
  return actionOk({ id: data.id });
}

export async function updateProject(
  projectId: string,
  input: ProjectInput
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      code: v.code,
      name: v.name,
      client_name: toNullable(v.clientName),
      gc_company: toNullable(v.gcCompany),
      site_address: toNullable(v.siteAddress),
      status: v.status,
      contract_value_cents: toCents(v.contractValue),
      start_date: toNullable(v.startDate),
      target_end_date: toNullable(v.targetEndDate),
    })
    .eq("id", projectId);

  if (error) {
    if (isUniqueViolation(error)) {
      return actionError("That job code is already in use.", {
        code: ["Already in use"],
      });
    }
    return actionError("Couldn't save changes.");
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return actionOk(undefined);
}

export async function updateProjectStatus(
  projectId: string,
  status: string
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = updateProjectStatusSchema.safeParse({ status });
  if (!parsed.success) {
    return actionError("That's not a valid status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: parsed.data.status })
    .eq("id", projectId);

  if (error) return actionError("Couldn't update the status.");

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return actionOk(undefined);
}

// A "delete" is a soft delete (sets deleted_at) — never a hard DELETE.
// Job history shouldn't disappear because of a misclick; there's simply no
// RLS policy that allows a real DELETE on this table (see migration 0002).
export async function deleteProject(projectId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) return actionError("Couldn't delete the project.");

  revalidatePath("/projects");
  redirect("/projects");
}

export async function assignEmployee(
  projectId: string,
  profileId: string
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = assignEmployeeSchema.safeParse({ profileId });
  if (!parsed.success) {
    return actionError("Pick a valid employee.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_assignments").insert({
    company_id: user.profile.company_id,
    project_id: projectId,
    profile_id: parsed.data.profileId,
    assigned_by: user.id,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return actionError("That employee is already assigned to this job.");
    }
    return actionError("Couldn't assign that employee.");
  }

  revalidatePath(`/projects/${projectId}/crew`);
  return actionOk(undefined);
}

export async function unassignEmployee(
  projectId: string,
  profileId: string
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_assignments")
    .delete()
    .eq("project_id", projectId)
    .eq("profile_id", profileId);

  if (error) return actionError("Couldn't remove that employee.");

  revalidatePath(`/projects/${projectId}/crew`);
  return actionOk(undefined);
}
