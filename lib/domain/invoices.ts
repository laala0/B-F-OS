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
// `today` must be a YYYY-MM-DD string in the company's timezone (see
// getCompanyToday) — comparing against `new Date()` directly would judge
// "overdue" against the server's clock/timezone instead of the company's.
export function isInvoiceOverdue(
  dueDate: string | null,
  status: InvoiceStatus,
  today: string
): boolean {
  if (!dueDate || status !== "sent") return false;
  return dueDate < today;
}
