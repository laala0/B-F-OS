"use server";

import { revalidatePath } from "next/cache";
import { requireProjectAccess, requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import { confirmDocumentSchema, type ConfirmDocumentInput } from "@/lib/validation/media";

export async function confirmDocumentUpload(
  projectId: string,
  input: ConfirmDocumentInput
): Promise<ActionResult> {
  const parsed = confirmDocumentSchema.safeParse(input);
  if (!parsed.success) return actionError("Couldn't save that upload.");
  const v = parsed.data;
  const { user } = await requireProjectAccess(projectId);

  const supabase = await createClient();

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("original_filename", v.originalFilename);

  const { error } = await supabase.from("documents").insert({
    company_id: user.profile.company_id,
    project_id: projectId,
    uploaded_by: user.id,
    storage_path: v.storagePath,
    original_filename: v.originalFilename,
    category: v.category,
    version: (count ?? 0) + 1,
    content_type: v.contentType,
    size_bytes: v.sizeBytes,
  });

  if (error) return actionError("Couldn't save that upload.");

  await supabase.rpc("record_activity", {
    p_project_id: projectId,
    p_event_type: "document_uploaded",
    p_description: `${user.profile.first_name} uploaded ${v.originalFilename}`,
  });

  revalidatePath(`/projects/${projectId}/documents`);
  return actionOk(undefined);
}

export async function deleteDocument(
  documentId: string,
  projectId: string
): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .select("storage_path")
    .single();

  if (error || !data) return actionError("Couldn't delete that document.");

  await supabase.storage.from("documents").remove([data.storage_path]);

  revalidatePath(`/projects/${projectId}/documents`);
  return actionOk(undefined);
}
