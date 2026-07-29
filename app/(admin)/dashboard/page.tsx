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

  const { data: company } = await supabase
    .from("companies")
    .select("name, timezone")
    .eq("id", user.profile.company_id)
    .single();
  const today = todayInTimezone(company?.timezone ?? "America/Vancouver");

  const [{ data: projects }, { data: tasks }, { data: invoices }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, status")
        .eq("company_id", user.profile.company_id)
        .is("deleted_at", null),
      supabase
        .from("tasks")
        .select("id, due_date, status")
        .eq("company_id", user.profile.company_id)
        .is("deleted_at", null),
      supabase
        .from("invoices")
        .select("id, amount_cents, status")
        .eq("company_id", user.profile.company_id)
        .is("deleted_at", null),
    ]);

  const activeProjects = (projects ?? []).filter(
    (p) => p.status === "active"
  ).length;
  const tasksDueToday = (tasks ?? []).filter(
    (t) => t.due_date === today && t.status !== "done"
  ).length;
  const overdueTasks = (tasks ?? []).filter(
    (t) => t.due_date && t.due_date < today && t.status !== "done"
  ).length;
  const outstandingCents = (invoices ?? [])
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + i.amount_cents, 0);

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
        <StatCard label="Active projects" value={activeProjects} />
        <StatCard label="Tasks due today" value={tasksDueToday} />
        <StatCard
          label="Overdue tasks"
          value={overdueTasks}
          tone={overdueTasks > 0 ? "red" : "default"}
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
