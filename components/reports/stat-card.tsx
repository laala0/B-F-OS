import Link from "next/link";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_TEXT = {
  default: "text-foreground",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
  gold: "text-[color-mix(in_oklch,var(--gold),black_20%)] dark:text-gold",
} as const;

const TONE_CHIP = {
  default: "bg-muted text-muted-foreground",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  gold: "bg-gold/15 text-[color-mix(in_oklch,var(--gold),black_20%)] dark:text-gold",
} as const;

export function StatCard({
  label,
  value,
  tone = "default",
  icon: Icon,
  href,
  style,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "amber" | "green" | "red" | "gold";
  icon?: LucideIcon;
  href?: string;
  style?: CSSProperties;
}) {
  const content = (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm p-5 transition-all duration-200 ease-out",
        href &&
          "group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-foreground/15 group-active:translate-y-0 group-active:scale-[0.97] group-active:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ease-out",
              href && "group-hover:scale-110 group-hover:rotate-3",
              TONE_CHIP[tone]
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-3xl tracking-wide text-tabular",
          TONE_TEXT[tone]
        )}
      >
        {value}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        className="group block animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-backwards duration-500 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      style={style}
      className="animate-in fade-in-0 slide-in-from-bottom-3 fill-mode-backwards duration-500"
    >
      {content}
    </div>
  );
}
