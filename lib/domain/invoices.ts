import type { InvoiceStatus } from "@/types/database";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
};

export const INVOICE_STATUS_BADGE_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  sent: "bg-sky-100 text-sky-700",
  paid: "bg-green-100 text-green-700",
};

// Overdue is derived, never stored — same convention as task due dates:
// a `status` column only tracks draft/sent/paid, not a fourth "overdue"
// state that would need something to keep it in sync.
export function isInvoiceOverdue(
  dueDate: string | null,
  status: InvoiceStatus
): boolean {
  if (!dueDate || status !== "sent") return false;
  return new Date(dueDate + "T23:59:59") < new Date();
}
