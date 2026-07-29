import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCompanyToday } from "@/lib/supabase/company";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusSelect } from "@/components/invoices/invoice-status-select";
import { InvoiceFormSheet } from "@/components/invoices/invoice-form-sheet";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";
import { formatCents } from "@/lib/domain/money";
import { isInvoiceOverdue } from "@/lib/domain/invoices";
import { cn } from "@/lib/utils";

export default async function InvoicesPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const today = await getCompanyToday(user.profile.company_id);

  const [{ data: invoices }, { data: projects }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, project:projects(id, name)")
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null)
      .order("issued_date", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name")
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null)
      .order("name"),
  ]);

  const invoiceList = invoices ?? [];
  const projectOptions = projects ?? [];

  const totalCents = invoiceList.reduce((sum, i) => sum + i.amount_cents, 0);
  const outstandingCents = invoiceList
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + i.amount_cents, 0);
  const paidCents = invoiceList
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          Invoice tracker
        </h1>
        <InvoiceFormSheet
          projects={projectOptions}
          trigger={<button className={buttonVariants()}>New invoice</button>}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <p className="text-xs font-medium text-muted-foreground">Total invoiced</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatCents(totalCents)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-xl font-semibold text-amber-600">
            {formatCents(outstandingCents)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <p className="text-xs font-medium text-muted-foreground">Paid</p>
          <p className="mt-1 text-xl font-semibold text-green-600">
            {formatCents(paidCents)}
          </p>
        </div>
      </div>

      {invoiceList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceList.map((invoice) => {
                const overdue = isInvoiceOverdue(
                  invoice.due_date,
                  invoice.status,
                  today
                );
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.project?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.issued_date}
                    </TableCell>
                    <TableCell
                      className={cn(overdue && "font-medium text-red-600")}
                    >
                      {invoice.due_date ?? "—"}
                      {overdue ? " (overdue)" : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCents(invoice.amount_cents)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusSelect
                        invoiceId={invoice.id}
                        status={invoice.status}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <InvoiceFormSheet
                          projects={projectOptions}
                          invoice={invoice}
                          trigger={
                            <button
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                            >
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
