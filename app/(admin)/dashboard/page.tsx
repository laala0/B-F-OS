import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/reports/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { formatCents } from "@/lib/domain/money";
import { todayInTimezone } from "@/lib/domain/reports";

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
  ]);

  const outstandingCents = (outstandingInvoices ?? []).reduce(
    (sum, i) => sum + i.amount_cents,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            {company?.name ?? "Your company"}
          </h1>
          <p className="text-sm text-neutral-500">
            Welcome back, {user.profile.first_name}.
          </p>
        </div>
        <Link href="/reports" className={buttonVariants({ variant: "outline" })}>
          View reports
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active projects" value={activeProjects ?? 0} />
        <StatCard label="Tasks due today" value={tasksDueToday ?? 0} />
        <StatCard
          label="Overdue tasks"
          value={overdueTasks ?? 0}
          tone={(overdueTasks ?? 0) > 0 ? "red" : "default"}
        />
        <StatCard
          label="Outstanding invoices"
          value={formatCents(outstandingCents)}
          tone="amber"
        />
      </div>

      <p className="text-xs text-neutral-400">
        Crew-on-site and hours-pending-approval widgets are still waiting on
        Phase 3 (Time Tracking).
      </p>
    </div>
  );
}
