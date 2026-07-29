"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInvoiceStatus } from "@/actions/invoices";
import { INVOICE_STATUSES } from "@/lib/validation/invoices";
import { INVOICE_STATUS_LABELS } from "@/lib/domain/invoices";
import type { InvoiceStatus } from "@/types/database";

export function InvoiceStatusSelect({
  invoiceId,
  status,
  size = "sm",
}: {
  invoiceId: string;
  status: InvoiceStatus;
  size?: "sm" | "default";
}) {
  const [isPending, startTransition] = useTransition();

  function onChange(next: string | null) {
    if (!next) return;
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, next);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger size={size} className="w-[110px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {INVOICE_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {INVOICE_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
