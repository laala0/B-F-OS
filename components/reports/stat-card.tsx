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
}: {
  label: string;
  value: string | number;
  tone?: "default" | "amber" | "green" | "red" | "gold";
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              TONE_CHIP[tone]
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-1.5 font-display text-2xl tracking-wide text-tabular",
          TONE_TEXT[tone]
        )}
      >
        {value}
      </p>
    </div>
  );
}
