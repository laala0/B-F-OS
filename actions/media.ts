"use server";

import { revalidatePath } from "next/cache";
import { requireProjectAccess, requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import { confirmMediaSchema, type ConfirmMediaInput } from "@/lib/validation/media";

// The browser already uploaded the bytes straight to Storage (see
// components/media/media-uploader.tsx) — this just records the metadata
// row once that succeeds. requireProjectAccess with requireAssignment=false
// allows any user in the company to upload media to any project.
export async function confirmMediaUpload(
  projectId: string,
  input: ConfirmMediaInput
): Promise<ActionResult> {
  const parsed = confirmMediaSchema.safeParse(input);
  if (!parsed.success) return actionError("Couldn't save that upload.");
  const v = parsed.data;
  const { user } = await requireProjectAccess(projectId, false);

  const supabase = await createClient();
  const { error } = await supabase.from("media").insert({
    company_id: user.profile.company_id,
    project_id: projectId,
    uploaded_by: user.id,
    storage_path: v.storagePath,
    content_type: v.contentType,
    size_bytes: v.sizeBytes,
    caption: v.caption && v.caption.trim().length > 0 ? v.caption.trim() : null,
  });

  if (error) return actionError("Couldn't save that upload.");

  await supabase.rpc("record_activity", {
    p_project_id: projectId,
    p_event_type: "media_uploaded",
    p_description: `${user.profile.first_name} added a photo/video`,
  });

  revalidatePath(`/projects/${projectId}/media`);
  return actionOk(undefined);
}

export async function deleteMedia(mediaId: string, projectId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  // delete + select in one round trip: RLS silently returns zero rows for
  // a delete it disallows rather than an error, so `!data` (not just
  // `error`) is what actually catches "you don't own this and aren't an
  // admin" here — same shape as updateTaskStatus's own update+select.
  const { data, error } = await supabase
    .from("media")
    .delete()
    .eq("id", mediaId)
    .select("storage_path")
    .single();

  if (error || !data) return actionError("Couldn't delete that file.");

  await supabase.storage.from("media").remove([data.storage_path]);

  revalidatePath(`/projects/${projectId}/media`);
  return actionOk(undefined);
}
