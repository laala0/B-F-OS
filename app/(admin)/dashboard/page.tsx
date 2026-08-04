import Link from "next/link";
import {
  Building2,
  CalendarClock,
  AlertTriangle,
  Receipt,
  HardHat,
  Hourglass,
  Image as ImageIcon,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/reports/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { formatCents } from "@/lib/domain/money";
import { todayInTimezone } from "@/lib/domain/reports";
import { durationHours } from "@/lib/domain/time";

export default async function DashboardPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const companyId = user.profile.company_id;

  const { data: company } = await supabase
    .from("companies")
    .select("name, timezone")
    .eq("id", companyId)
    .single();
  const today = todayInTimezone(company?.timezone ?? "America/Vancouver");

  // Counted/summed in Postgres (count: "exact", head: true returns just the
  // count, no rows) instead of fetching every project/task/invoice in the
  // company and reducing them in JS — these four numbers used to cost a
  // full-table transfer each, and that transfer only grows as the company
  // racks up history.
  const [
    { count: activeProjects },
    { count: tasksDueToday },
    { count: overdueTasks },
    { data: outstandingInvoices },
    { count: crewOnSite },
    { data: pendingEntries },
    { count: photosAddedToday },
    { data: recentPhotos },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("due_date", today)
      .neq("status", "done")
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .lt("due_date", today)
      .neq("status", "done")
      .is("deleted_at", null),
    supabase
      .from("invoices")
      .select("amount_cents")
      .eq("company_id", companyId)
      .eq("status", "sent")
      .is("deleted_at", null),
    supabase
      .from("time_entries")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "open"),
    supabase
      .from("time_entries")
      .select("clock_in, clock_out")
      .eq("company_id", companyId)
      .eq("status", "pending"),
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`),
    supabase
      .from("media")
      .select("id, storage_path, content_type, project_id, created_at")
      .eq("company_id", companyId)
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const outstandingCents = (outstandingInvoices ?? []).reduce(
    (sum, i) => sum + i.amount_cents,
    0
  );
  const hoursPendingApproval = (pendingEntries ?? []).reduce(
    (sum, e) => sum + durationHours(e.clock_in, e.clock_out),
    0
  );

  // Generate signed URLs for recent photos
  const photosWithUrls = await Promise.all(
    (recentPhotos ?? []).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from("media")
        .createSignedUrl(photo.storage_path, 3600);
      return { ...photo, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {company?.name ?? "Your company"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.profile.first_name}.
          </p>
        </div>
        <Link href="/reports" className={buttonVariants({ variant: "outline" })}>
          View reports
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Active projects"
          value={activeProjects ?? 0}
          icon={Building2}
          href="/admin/projects"
          style={{ animationDelay: "0ms" }}
        />
        <StatCard
          label="Crew on site"
          value={crewOnSite ?? 0}
          icon={HardHat}
          href="/admin/crew"
          tone={(crewOnSite ?? 0) > 0 ? "green" : "default"}
          style={{ animationDelay: "50ms" }}
        />
        <StatCard
          label="Tasks due today"
          value={tasksDueToday ?? 0}
          icon={CalendarClock}
          href="/admin/projects"
          style={{ animationDelay: "100ms" }}
        />
        <StatCard
          label="Overdue tasks"
          value={overdueTasks ?? 0}
          icon={AlertTriangle}
          href="/admin/projects"
          tone={(overdueTasks ?? 0) > 0 ? "red" : "default"}
          style={{ animationDelay: "150ms" }}
        />
        <StatCard
          label="Hours pending approval"
          value={hoursPendingApproval.toFixed(1)}
          icon={Hourglass}
          href="/admin/timesheets"
          tone={hoursPendingApproval > 0 ? "amber" : "default"}
          style={{ animationDelay: "200ms" }}
        />
        <StatCard
          label="Outstanding invoices"
          value={formatCents(outstandingCents)}
          icon={Receipt}
          href="/admin/invoices"
          tone="gold"
          style={{ animationDelay: "250ms" }}
        />
      </div>

      {photosAddedToday && photosAddedToday > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fb1616] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#fb1616]" />
              </span>
              Photos added today ({photosAddedToday})
            </h2>
            <Link
              href="/admin/projects"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {photosWithUrls.map((photo, i) => (
              <Link
                key={photo.id}
                href={`/admin/projects/${photo.project_id}/media`}
                style={{ animationDelay: `${i * 40}ms`, animationDuration: "400ms" }}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border animate-in fade-in-0 zoom-in-95 fill-mode-backwards transition-[transform,box-shadow] duration-200 ease-out hover:shadow-md hover:border-foreground/15 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {photo.url ? (
                  photo.content_type?.startsWith("video") ? (
                    <video
                      src={photo.url}
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.url}
                      alt="Today's photo"
                      className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  )
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
