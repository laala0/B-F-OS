"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import type { Json } from "@/types/database";
import {
  decidePostSchema,
  reviewPhotoSchema,
  updateJobSiteSchema,
  type DecidePostInput,
  type ReviewPhotoInput,
  type UpdateJobSiteInput,
} from "@/lib/validation/content";

// Every decision goes to agent_approvals, which is what the worker on the Mac
// resumes its paused LangGraph thread from. The row update alongside it is so the
// next screen is right immediately, without waiting for the worker's next tick.
// RLS scopes all of this to the Form2Finish admin.

async function decide(threadId: string, decision: Json) {
  const supabase = await createClient();
  return supabase
    .from("agent_approvals")
    .update({ status: "decided", decision, decided_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("status", "pending");
}

export async function reviewPhoto(input: ReviewPhotoInput): Promise<ActionResult> {
  const parsed = reviewPhotoSchema.safeParse(input);
  if (!parsed.success) return actionError("Couldn't save that.");
  const v = parsed.data;
  await requireRole("admin");
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("content_assets")
    .select("id, catalog_id")
    .eq("id", v.assetId)
    .single();
  if (!asset) return actionError("Couldn't find that photo.");

  const { error } = await supabase
    .from("content_assets")
    .update({
      review_status: v.action === "keep" ? "kept" : "skipped",
      stage: v.stage,
      brand: v.brand,
      job_site_id: v.jobSiteId,
      public_ok: v.publicOk,
      notes: v.notes || null,
    })
    .eq("id", v.assetId);
  if (error) return actionError("Couldn't save that.");

  const { error: decisionError } = await decide(`asset:${asset.catalog_id}`, {
    action: v.action,
    stage: v.stage ?? null,
    brand: v.brand ?? null,
    job_site_id: v.jobSiteId ?? null,
    public_ok: v.publicOk ?? false,
    notes: v.notes ?? null,
  });
  if (decisionError) return actionError("Couldn't save that.");

  revalidatePath("/content");
  return actionOk(undefined);
}

export async function decidePost(input: DecidePostInput): Promise<ActionResult> {
  const parsed = decidePostSchema.safeParse(input);
  if (!parsed.success) return actionError("Couldn't save that.");
  const v = parsed.data;
  await requireRole("admin");
  const supabase = await createClient();

  const { data: approval } = await supabase
    .from("agent_approvals")
    .select("thread_id")
    .eq("kind", "approve_post")
    .eq("status", "pending")
    .contains("payload", { post_id: v.postId })
    .maybeSingle();
  if (!approval) return actionError("This post is still being prepared.");

  const nextStatus = v.action === "approve" ? "approved" : v.action === "reject" ? "rejected" : "edited";
  const { error } = await supabase
    .from("posts")
    .update({
      status: nextStatus,
      ...(v.action === "edit" ? { caption: v.caption } : {}),
      ...(v.action === "reject" ? { feedback: v.feedback ?? null } : {}),
    })
    .eq("id", v.postId);
  if (error) return actionError("Couldn't save that.");

  const { error: decisionError } = await decide(approval.thread_id, v as unknown as Json);
  if (decisionError) return actionError("Couldn't save that.");

  revalidatePath("/content/posts");
  return actionOk(undefined);
}

export async function updateJobSite(input: UpdateJobSiteInput): Promise<ActionResult> {
  const parsed = updateJobSiteSchema.safeParse(input);
  if (!parsed.success) return actionError("Couldn't save that.");
  const v = parsed.data;
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_sites")
    .update({ address: v.address || null, performed_by: v.performedBy || null, confirmed: v.confirmed })
    .eq("id", v.jobSiteId);
  if (error) return actionError("Couldn't save that.");

  revalidatePath("/content/jobs");
  return actionOk(undefined);
}
