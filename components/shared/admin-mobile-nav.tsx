"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/shared/brand-mark";
import { AdminNavLinks } from "@/components/shared/admin-nav";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="w-72 gap-0 border-sidebar-border bg-sidebar p-3 [&_[data-slot=sheet-close]]:text-sidebar-foreground/60 [&_[data-slot=sheet-close]]:hover:text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Jump to a section of Boss &amp; Friends OS
        </SheetDescription>
        <div className="mb-5 px-1 pt-1">
          <BrandMark size="sm" />
        </div>
        <div className="flex flex-col gap-1">
          <AdminNavLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </Sheet>
  );
}
