import { z } from "zod";

export const INVOICE_STATUSES = ["draft", "sent", "paid"] as const;

const optionalText = z.string().trim().optional();

// String-in/string-out on purpose, same reasoning as projectSchema: the
// dollars-as-string -> cents conversion happens in actions/invoices.ts,
// not here, so react-hook-form's field types match the schema's input type.
export const invoiceSchema = z.object({
  projectId: z.string().uuid("Pick a project"),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required").max(64),
  amount: z
    .string()
    .refine(
      (v) => v.trim() !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0,
      "Enter a valid amount"
    ),
  status: z.enum(INVOICE_STATUSES),
  issuedDate: z.string().trim().min(1, "Issued date is required"),
  dueDate: optionalText,
  notes: optionalText,
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUSES),
});
