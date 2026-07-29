"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import {
  invoiceSchema,
  INVOICE_STATUSES,
  type InvoiceInput,
} from "@/lib/validation/invoices";
import { INVOICE_STATUS_LABELS } from "@/lib/domain/invoices";
import type { Invoice } from "@/types/database";

type ProjectOption = { id: string; name: string };

function defaultValuesFor(
  invoice?: Invoice,
  defaultProjectId?: string
): InvoiceInput {
  return {
    projectId: invoice?.project_id ?? defaultProjectId ?? "",
    invoiceNumber: invoice?.invoice_number ?? "",
    amount: invoice ? String(invoice.amount_cents / 100) : "",
    status: invoice?.status ?? "draft",
    issuedDate: invoice?.issued_date ?? new Date().toISOString().slice(0, 10),
    dueDate: invoice?.due_date ?? "",
    notes: invoice?.notes ?? "",
  };
}

export function InvoiceForm({
  projects,
  invoice,
  defaultProjectId,
  onSuccess,
}: {
  projects: ProjectOption[];
  invoice?: Invoice;
  defaultProjectId?: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const mode = invoice ? "edit" : "create";

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValuesFor(invoice, defaultProjectId),
  });

  function applyFieldErrors(fieldErrors?: Record<string, string[]>) {
    if (!fieldErrors) return;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      form.setError(field as keyof InvoiceInput, { message: messages?.[0] });
    }
  }

  function onSubmit(values: InvoiceInput) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createInvoice(values)
          : await updateInvoice(invoice!.id, values);

      if (!result.ok) {
        toast.error(result.error);
        applyFieldErrors(result.fieldErrors);
        return;
      }
      toast.success(mode === "create" ? "Invoice created." : "Changes saved.");
      onSuccess();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick a project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice #</FormLabel>
                <FormControl>
                  <Input placeholder="INV-1042" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" placeholder="1250.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issuedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issued date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INVOICE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {INVOICE_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : mode === "create"
                ? "Create invoice"
                : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
