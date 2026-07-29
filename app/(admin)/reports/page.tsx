import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/reports/stat-card";
import { ReportNav } from "@/components/reports/report-nav";
import {
  TaskListTable,
  type ReportTaskRow,
} from "@/components/reports/task-list-table";
import { formatCents } from "@/lib/domain/money";
import { isOverdue } from "@/lib/domain/tasks";
import {
  addDays,
  dateInTimezone,
  formatDateLabel,
  isInRange,
  todayInTimezone,
  weekRange,
} from "@/lib/domain/reports";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: rawView, date: rawDate } = await searchParams;
  const user = await requireRole("admin");
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("timezone")
    .eq("id", user.profile.company_id)
    .single();
  const timezone = company?.timezone ?? "America/Vancouver";
  const today = todayInTimezone(timezone);

  const view: "daily" | "weekly" = rawView === "weekly" ? "weekly" : "daily";
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : today;
  const { start: weekStart, end: weekEnd } = weekRange(date);

  const [
    { data: tasks },
    { data: invoices },
    { data: profiles },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, title, project_id, priority, status, due_date, completed_at, assigned_to"
      )
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null),
    supabase
      .from("invoices")
      .select(
        "id, invoice_number, project_id, amount_cents, status, issued_date, due_date, paid_date"
      )
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null),
    supabase
      .from("projects")
      .select("id, name")
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null),
  ]);

  const projectName = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const assigneeName = new Map(
    (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`])
  );

  const taskList = tasks ?? [];
  const invoiceList = invoices ?? [];

  function toRow(t: (typeof taskList)[number]): ReportTaskRow {
    return {
      id: t.id,
      title: t.title,
      projectName: projectName.get(t.project_id) ?? "—",
      assigneeName: t.assigned_to
        ? (assigneeName.get(t.assigned_to) ?? "—")
        : "Unassigned",
      priority: t.priority,
      dueDate: t.due_date,
    };
  }

  // "Currently overdue" is always a snapshot as of right now, even when
  // browsing a past day/week — we only track current status, not a
  // historical log of it, so pretending we can reconstruct "overdue as of
  // that date" would just be guessing.
  const overdueTasks = taskList.filter((t) =>
    isOverdue(t.due_date, t.status, today)
  );

  const rangeStart = view === "daily" ? date : weekStart;
  const rangeEnd = view === "daily" ? date : weekEnd;

  const dueInRange = taskList.filter((t) =>
    isInRange(t.due_date, rangeStart, rangeEnd)
  );
  const completedInRange = taskList.filter(
    (t) =>
      t.completed_at &&
      isInRange(dateInTimezone(t.completed_at, timezone), rangeStart, rangeEnd)
  );
  const invoicesIssuedInRange = invoiceList.filter((i) =>
    isInRange(i.issued_date, rangeStart, rangeEnd)
  );
  const invoicesPaidInRange = invoiceList.filter((i) =>
    isInRange(i.paid_date, rangeStart, rangeEnd)
  );

  const issuedCents = invoicesIssuedInRange.reduce(
    (sum, i) => sum + i.amount_cents,
    0
  );
  const paidCents = invoicesPaidInRange.reduce(
    (sum, i) => sum + i.amount_cents,
    0
  );

  const dayBreakdown =
    view === "weekly"
      ? Array.from({ length: 7 }, (_, i) => {
          const d = addDays(weekStart, i);
          return {
            date: d,
            completed: taskList.filter(
              (t) =>
                t.completed_at && dateInTimezone(t.completed_at, timezone) === d
            ).length,
            due: taskList.filter((t) => t.due_date === d).length,
          };
        })
      : [];

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Reports</h1>

      <ReportNav
        view={view}
        date={date}
        today={today}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Tasks completed"
          value={completedInRange.length}
          tone="green"
        />
        <StatCard label="Tasks due" value={dueInRange.length} />
        <StatCard
          label="Currently overdue"
          value={overdueTasks.length}
          tone={overdueTasks.length > 0 ? "red" : "default"}
        />
        <StatCard label="Invoiced" value={formatCents(issuedCents)} />
        <StatCard label="Paid" value={formatCents(paidCents)} tone="green" />
      </div>

      {view === "weekly" ? (
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <p className="mb-2 text-sm font-medium text-foreground">By day</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-medium">Day</th>
                <th className="pb-2 font-medium">Completed</th>
                <th className="pb-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {dayBreakdown.map((d) => (
                <tr key={d.date} className="border-t border-border">
                  <td className="py-1.5">{formatDateLabel(d.date)}</td>
                  <td className="py-1.5">{d.completed}</td>
                  <td className="py-1.5">{d.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          {view === "daily" ? "Due today" : "Due this week"}
        </p>
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <TaskListTable
            tasks={dueInRange.map(toRow)}
            emptyLabel="Nothing due."
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          {view === "daily" ? "Completed today" : "Completed this week"}
        </p>
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <TaskListTable
            tasks={completedInRange.map(toRow)}
            emptyLabel="Nothing completed yet."
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Currently overdue
        </p>
        <div className="rounded-lg border border-border bg-card shadow-sm p-4">
          <TaskListTable
            tasks={overdueTasks.map(toRow)}
            emptyLabel="Nothing overdue."
            showDueDate
          />
        </div>
      </div>
    </div>
  );
}
