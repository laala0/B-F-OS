"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "crew", label: "Crew" },
  { segment: "tasks", label: "Tasks" },
  { segment: "media", label: "Media" },
  { segment: "documents", label: "Documents" },
  { segment: "activity", label: "Activity" },
  { segment: "invoices", label: "Invoices" },
];

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex gap-1 border-b border-neutral-200">
      {TABS.map(({ segment, label }) => {
        const href = segment ? `${base}/${segment}` : base;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium -mb-px",
              active
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
