"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/capture", label: "Capture", icon: Camera },
  { href: "/notes", label: "Notes", icon: NotebookPen },
];

export function FieldTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-transform active:scale-95",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "absolute top-0 h-[3px] w-9 rounded-full bg-gold transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
            />
            <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
