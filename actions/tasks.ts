"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import {
  taskSchema,
  updateTaskStatusSchema,
  UNASSIGNED,
  type TaskInput,
} from "@/lib/validation/tasks";

function toNullable(s: string | undefined): string | null {
  return s && s.trim().length > 0 ? s.trim() : null;
}

function toAssignee(id: string | undefined): string | null {
  return id && id !== UNASSIGNED ? id : null;
}

export async function createTask(
  projectId: string,
  input: TaskInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("admin");
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      company_id: user.profile.company_id,
      project_id: projectId,
      title: v.title,
      description: toNullable(v.description),
      priority: v.priority,
      due_date: toNullable(v.dueDate),
      assigned_to: toAssignee(v.assignedTo),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !task) return actionError("Couldn't create the task.");

  if (v.checklist.length > 0) {
    const { error: checklistError } = await supabase
      .from("task_checklist_items")
      .insert(
        v.checklist.map((item, index) => ({
          company_id: user.profile.company_id,
          task_id: task.id,
          label: item.label,
          is_done: item.isDone,
          position: index,
        }))
      );
    if (checklistError) {
      return actionError("Task created, but the checklist failed to save.");
    }
  }

  revalidatePath(`/projects/${projectId}/tasks`);
  return actionOk({ id: task.id });
}

export async function updateTask(
  taskId: string,
  input: TaskInput
): Promise<ActionResult> {
  const user = await requireRole("admin");
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      title: v.title,
      description: toNullable(v.description),
      priority: v.priority,
      due_date: toNullable(v.dueDate),
      assigned_to: toAssignee(v.assignedTo),
    })
    .eq("id", taskId)
    .select("project_id")
    .single();

  if (error || !task) return actionError("Couldn't save changes.");

  // Reconcile the checklist: rows with an id that still appears get
  // updated, rows without an id are new, and any existing id no longer
  // present in the submitted list gets deleted.
  const { data: existingItems } = await supabase
    .from("task_checklist_items")
    .select("id")
    .eq("task_id", taskId);

  const existingIds = new Set((existingItems ?? []).map((i) => i.id));
  const keptIds = new Set(
    v.checklist.filter((i) => i.id).map((i) => i.id!)
  );
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));
  const toInsert = v.checklist.filter((i) => !i.id);
  const toUpdate = v.checklist.filter((i) => i.id && existingIds.has(i.id));

  if (toDelete.length > 0) {
    await supabase.from("task_checklist_items").delete().in("id", toDelete);
  }
  if (toInsert.length > 0) {
    await supabase.from("task_checklist_items").insert(
      toInsert.map((item) => ({
        company_id: user.profile.company_id,
        task_id: taskId,
        label: item.label,
        is_done: item.isDone,
        position: v.checklist.indexOf(item),
      }))
    );
  }
  for (const item of toUpdate) {
    await supabase
      .from("task_checklist_items")
      .update({
        label: item.label,
        is_done: item.isDone,
        position: v.checklist.indexOf(item),
      })
      .eq("id", item.id!);
  }

  revalidatePath(`/projects/${task.project_id}/tasks`);
  revalidatePath(`/tasks/${taskId}`);
  return actionOk(undefined);
}

// Soft delete, same convention as profiles/projects — no DELETE policy
// exists on tasks at all.
export async function deleteTask(
  taskId: string,
  projectId: string
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return actionError("Couldn't delete the task.");

  revalidatePath(`/projects/${projectId}/tasks`);
  return actionOk(undefined);
}

// Called by admins (any task) or the assigned employee (their own task
// only) — RLS policies plus the prevent_task_field_escalation trigger are
// the actual boundary, same philosophy as every guard in lib/auth/guards.ts.
export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<ActionResult> {
  await requireUser();
  const parsed = updateTaskStatusSchema.safeParse({ status });
  if (!parsed.success) return actionError("That's not a valid status.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("id", taskId)
    .select("project_id")
    .single();

  if (error || !data) return actionError("Couldn't update the status.");

  revalidatePath(`/projects/${data.project_id}/tasks`);
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/today");
  return actionOk(undefined);
}

// Same admin-or-assigned-employee split as updateTaskStatus, one level
// down — this is the standalone toggle used on the employee task detail
// page (admin's bulk checklist edits go through updateTask instead).
export async function toggleChecklistItem(
  itemId: string,
  isDone: boolean
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_checklist_items")
    .update({ is_done: isDone })
    .eq("id", itemId)
    .select("task_id")
    .single();

  if (error || !data) return actionError("Couldn't update the checklist item.");

  revalidatePath(`/tasks/${data.task_id}`);
  revalidatePath("/today");
  return actionOk(undefined);
}
