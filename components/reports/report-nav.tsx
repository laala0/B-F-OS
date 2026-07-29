import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, formatDateLabel, formatDateRangeLabel } from "@/lib/domain/reports";

export function ReportNav({
  view,
  date,
  today,
  weekStart,
  weekEnd,
}: {
  view: "daily" | "weekly";
  date: string;
  today: string;
  weekStart: string;
  weekEnd: string;
}) {
  const step = view === "daily" ? 1 : 7;
  const prevDate = addDays(date, -step);
  const nextDate = addDays(date, step);
  const isCurrent = view === "daily" ? date === today : today >= weekStart && today <= weekEnd;

  const label =
    view === "daily"
      ? date === today
        ? "Today"
        : formatDateLabel(date)
      : formatDateRangeLabel(weekStart, weekEnd);

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1">
        <Link
          href={`/reports?view=daily&date=${date}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            view === "daily"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:bg-neutral-100"
          )}
        >
          Daily
        </Link>
        <Link
          href={`/reports?view=weekly&date=${date}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            view === "weekly"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:bg-neutral-100"
          )}
        >
          Weekly
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/reports?view=${view}&date=${prevDate}`}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          aria-label="Previous"
        >
          ←
        </Link>
        <span className="min-w-[9rem] text-center text-sm font-medium text-neutral-900">
          {label}
        </span>
        <Link
          href={`/reports?view=${view}&date=${nextDate}`}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          aria-label="Next"
        >
          →
        </Link>
        {!isCurrent ? (
          <Link
            href={`/reports?view=${view}&date=${today}`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {view === "daily" ? "Today" : "This week"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
