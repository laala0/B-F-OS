import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCompanyToday } from "@/lib/supabase/company";
import { buttonVariants } from "@/components/ui/button";
import { InvoiceStatusSelect } from "@/components/invoices/invoice-status-select";
import { InvoiceFormSheet } from "@/components/invoices/invoice-form-sheet";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { formatCents } from "@/lib/domain/money";
import { isInvoiceOverdue } from "@/lib/domain/invoices";
import { cn } from "@/lib/utils";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const user = await requireRole("admin");
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, project:projects(id, name)")
    .eq("id", invoiceId)
    .is("deleted_at", null)
    .single();

  if (!invoice) notFound();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", user.profile.company_id)
    .is("deleted_at", null)
    .order("name");

  const today = await getCompanyToday(user.profile.company_id);
  const overdue = isInvoiceOverdue(invoice.due_date, invoice.status, today);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/invoices"
            className="text-sm text-neutral-500 hover:underline"
          >
            ← Invoice tracker
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-neutral-900">
            {invoice.invoice_number}
          </h1>
          <p className="text-sm text-neutral-500">{invoice.project?.name}</p>
        </div>
        <div className="flex gap-2">
          <InvoiceFormSheet
            projects={projects ?? []}
            invoice={invoice}
            trigger={
              <button className={buttonVariants({ variant: "outline" })}>
                Edit
              </button>
            }
          />
          <DeleteInvoiceDialog
            invoiceId={invoice.id}
            projectId={invoice.project_id}
            invoiceNumber={invoice.invoice_number}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-xs font-medium text-neutral-500">Amount</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {formatCents(invoice.amount_cents)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-500">Status</p>
          <div className="mt-1">
            <InvoiceStatusSelect
              invoiceId={invoice.id}
              status={invoice.status}
              size="default"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-500">Issued date</p>
          <p className="mt-1 text-sm text-neutral-900">{invoice.issued_date}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-500">Due date</p>
          <p
            className={cn(
              "mt-1 text-sm",
              overdue ? "font-medium text-red-600" : "text-neutral-900"
            )}
          >
            {invoice.due_date ?? "—"}
            {overdue ? " (overdue)" : ""}
          </p>
        </div>
        {invoice.paid_date ? (
          <div>
            <p className="text-xs font-medium text-neutral-500">Paid date</p>
            <p className="mt-1 text-sm text-neutral-900">{invoice.paid_date}</p>
          </div>
        ) : null}
      </div>

      {invoice.notes ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-medium text-neutral-500">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
            {invoice.notes}
          </p>
        </div>
      ) : null}
    </div>
  );
}
