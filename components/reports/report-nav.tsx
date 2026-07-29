import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      <div className="flex gap-1 rounded-lg border border-border bg-card shadow-sm p-1">
        <Link
          href={`/reports?view=daily&date=${date}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            view === "daily"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Daily
        </Link>
        <Link
          href={`/reports?view=weekly&date=${date}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium",
            view === "weekly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
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
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="min-w-[9rem] text-center text-sm font-medium text-foreground text-tabular">
          {label}
        </span>
        <Link
          href={`/reports?view=${view}&date=${nextDate}`}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
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
