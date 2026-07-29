import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/reports/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimeEntryStatusBadge } from "@/components/timesheets/time-entry-status-badge";
import { TimeEntryActions } from "@/components/timesheets/time-entry-actions";
import { durationHours, formatDuration } from "@/lib/domain/time";

export default async function TimesheetsPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("time_entries")
    .select(
      "id, clock_in, clock_out, status, notes, company_id, profile_id, project_id, created_at, updated_at, profile:profiles(first_name, last_name), project:projects(name)"
    )
    .eq("company_id", user.profile.company_id)
    .order("clock_in", { ascending: false })
    .limit(200);

  const rows = entries ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const hoursThisWeek = rows
    .filter((r) => r.status === "approved" && new Date(r.clock_in).getTime() >= weekAgo)
    .reduce((sum, r) => sum + durationHours(r.clock_in, r.clock_out), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-foreground">Timesheets</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Pending review" value={pending.length} tone={pending.length > 0 ? "amber" : "default"} />
        <StatCard label="Approved hours (7d)" value={hoursThisWeek.toFixed(1)} />
        <StatCard label="Total entries" value={rows.length} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No time entries yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crew</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Clock in</TableHead>
                <TableHead>Clock out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.profile?.first_name} {entry.profile?.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.project?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(entry.clock_in).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.clock_out
                      ? new Date(entry.clock_out).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>{formatDuration(entry.clock_in, entry.clock_out)}</TableCell>
                  <TableCell>
                    <TimeEntryStatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell>
                    <TimeEntryActions entry={entry} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
