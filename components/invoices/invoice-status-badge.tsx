import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_BADGE_CLASS,
} from "@/lib/domain/invoices";
import type { InvoiceStatus } from "@/types/database";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", INVOICE_STATUS_BADGE_CLASS[status])}
    >
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}
