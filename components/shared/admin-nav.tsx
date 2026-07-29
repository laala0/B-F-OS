"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Clock,
  Users,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Building2 },
  { href: "/timesheets", label: "Timesheets", icon: Clock },
  { href: "/crew", label: "Crew", icon: Users },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** The nav link list itself — shared between the persistent desktop rail
 * and the mobile drawer so the two never drift out of sync. */
export function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-lg py-2.5 pr-3 pl-3.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <span
              className={cn(
                "absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
            />
            <Icon
              className={cn(
                "h-4.5 w-4.5 shrink-0",
                active ? "text-gold" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
              )}
              strokeWidth={2}
            />
            {label}
          </Link>
        );
      })}
    </>
  );
}
