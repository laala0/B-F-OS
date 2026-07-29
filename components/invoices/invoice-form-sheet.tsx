"use client";

import { useState, type ReactElement } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import type { Invoice } from "@/types/database";

type ProjectOption = { id: string; name: string };

export function InvoiceFormSheet({
  projects,
  invoice,
  defaultProjectId,
  trigger,
}: {
  projects: ProjectOption[];
  invoice?: Invoice;
  defaultProjectId?: string;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{invoice ? "Edit invoice" : "New invoice"}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          <InvoiceForm
            projects={projects}
            invoice={invoice}
            defaultProjectId={defaultProjectId}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
