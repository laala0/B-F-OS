"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { actionOk, actionError, type ActionResult } from "@/types/domain";
import {
  invoiceSchema,
  updateInvoiceStatusSchema,
  type InvoiceInput,
} from "@/lib/validation/invoices";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

function toNullable(s: string | undefined): string | null {
  return s && s.trim().length > 0 ? s.trim() : null;
}

function toCents(dollars: string): number {
  return Math.round(Number(dollars) * 100);
}

function revalidateInvoicePaths(invoiceId: string, projectId: string) {
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/projects/${projectId}/invoices`);
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function createInvoice(
  input: InvoiceInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole("admin");
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      company_id: user.profile.company_id,
      project_id: v.projectId,
      invoice_number: v.invoiceNumber,
      amount_cents: toCents(v.amount),
      status: v.status,
      issued_date: v.issuedDate,
      due_date: toNullable(v.dueDate),
      notes: toNullable(v.notes),
      paid_date: v.status === "paid" ? v.issuedDate : null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return actionError("That invoice number is already in use.", {
        invoiceNumber: ["Already in use"],
      });
    }
    return actionError("Couldn't create the invoice.");
  }

  revalidateInvoicePaths(data.id, v.projectId);
  return actionOk({ id: data.id });
}

export async function updateInvoice(
  invoiceId: string,
  input: InvoiceInput
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Check the highlighted fields.",
      parsed.error.flatten().fieldErrors
    );
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("invoices")
    .select("paid_date")
    .eq("id", invoiceId)
    .single();

  const { error } = await supabase
    .from("invoices")
    .update({
      project_id: v.projectId,
      invoice_number: v.invoiceNumber,
      amount_cents: toCents(v.amount),
      status: v.status,
      issued_date: v.issuedDate,
      due_date: toNullable(v.dueDate),
      notes: toNullable(v.notes),
      paid_date:
        v.status === "paid" ? existing?.paid_date ?? v.issuedDate : null,
    })
    .eq("id", invoiceId);

  if (error) {
    if (isUniqueViolation(error)) {
      return actionError("That invoice number is already in use.", {
        invoiceNumber: ["Already in use"],
      });
    }
    return actionError("Couldn't save changes.");
  }

  revalidateInvoicePaths(invoiceId, v.projectId);
  return actionOk(undefined);
}

// Soft delete, same convention as profiles/projects/tasks.
export async function deleteInvoice(
  invoiceId: string,
  projectId: string
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", invoiceId);

  if (error) return actionError("Couldn't delete the invoice.");

  revalidateInvoicePaths(invoiceId, projectId);
  return actionOk(undefined);
}

// Quick status change from the list/detail page. Setting status to "paid"
// stamps paid_date (today, unless one already existed); moving off "paid"
// clears it — paid_date should only ever mean "the date this was marked
// paid," not a stale leftover from a prior state.
export async function updateInvoiceStatus(
  invoiceId: string,
  status: string
): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = updateInvoiceStatusSchema.safeParse({ status });
  if (!parsed.success) return actionError("That's not a valid status.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .update({
      status: parsed.data.status,
      paid_date:
        parsed.data.status === "paid"
          ? new Date().toISOString().slice(0, 10)
          : null,
    })
    .eq("id", invoiceId)
    .select("project_id")
    .single();

  if (error || !data) return actionError("Couldn't update the status.");

  revalidateInvoicePaths(invoiceId, data.project_id);
  return actionOk(undefined);
}
