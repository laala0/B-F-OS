import Link from "next/link";
import { requireProjectAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCompanyToday } from "@/lib/supabase/company";
import { ProjectNav } from "@/components/projects/project-nav";
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

export default async function ProjectInvoicesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user, project } = await requireProjectAccess(projectId);
  const supabase = await createClient();
  const today = await getCompanyToday(user.profile.company_id);

  const [{ data: invoices }, { data: projects }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .eq("project_id", projectId)
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

  return (
    <div className="max-w-4xl space-y-6">
      <ProjectNav projectId={projectId} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          Invoices — {project.name}
        </h1>
        <InvoiceFormSheet
          projects={projects ?? []}
          defaultProjectId={projectId}
          trigger={<button className={buttonVariants()}>New invoice</button>}
        />
      </div>

      {invoiceList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No invoices for this job yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
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
                          projects={projects ?? []}
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
