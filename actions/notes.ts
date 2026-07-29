"use server";

import { revalidatePath } from "next/cache";
import { requireProjectAccess, requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import { createNoteSchema, type CreateNoteInput } from "@/lib/validation/notes";

function toNullable(s: string | undefined): string | null {
  return s && s.trim().length > 0 ? s.trim() : null;
}

export async function createNote(input: CreateNoteInput): Promise<ActionResult> {
  const parsed = createNoteSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;
  const { user } = await requireProjectAccess(v.projectId);

  const supabase = await createClient();
  const { error } = await supabase.from("daily_notes").insert({
    company_id: user.profile.company_id,
    project_id: v.projectId,
    author_id: user.id,
    weather: toNullable(v.weather),
    crew_count: v.crewCount && v.crewCount.trim() !== "" ? Number(v.crewCount) : null,
    note: v.note,
  });

  if (error) return actionError("Couldn't save that note.");

  await supabase.rpc("record_activity", {
    p_project_id: v.projectId,
    p_event_type: "note_added",
    p_description: `${user.profile.first_name} added a daily note`,
  });

  revalidatePath("/notes");
  revalidatePath(`/projects/${v.projectId}/activity`);
  return actionOk(undefined);
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("daily_notes").delete().eq("id", noteId);

  if (error) return actionError("Couldn't delete that note.");

  revalidatePath("/notes");
  return actionOk(undefined);
}
