import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getCompanyToday } from "@/lib/supabase/company";
import { ClockWidget } from "@/components/field/clock-widget";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TASK_STATUS_LABELS, TASK_STATUS_BADGE_CLASS, isOverdue } from "@/lib/domain/tasks";
import { cn } from "@/lib/utils";

export default async function TodayPage() {
  const user = await requireRole("admin", "employee");
  const supabase = await createClient();
  const today = await getCompanyToday(user.profile.company_id);

  const [{ data: tasks }, { data: openEntry }, { data: assignments }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, due_date, priority, project:projects(name)")
      .eq("assigned_to", user.id)
      .is("deleted_at", null),
    supabase
      .from("time_entries")
      .select("*")
      .eq("profile_id", user.id)
      .eq("status", "open")
      .maybeSingle(),
    supabase
      .from("project_assignments")
      .select("project:projects(id, name)")
      .eq("profile_id", user.id),
  ]);

  const assignedProjects = (assignments ?? [])
    .map((a) => a.project)
    .filter((p): p is { id: string; name: string } => p != null);

  const priorityWeight = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...(tasks ?? [])].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const aOverdue = isOverdue(a.due_date, a.status, today);
    const bOverdue = isOverdue(b.due_date, b.status, today);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold text-foreground">
        Hey {user.profile.first_name}
      </h1>

      <ClockWidget openEntry={openEntry ?? null} projects={assignedProjects} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Your tasks</p>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing&apos;s assigned to you right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((task) => {
              const overdue = isOverdue(task.due_date, task.status, today);
              return (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className={cn(
                      "block rounded-lg border border-border bg-card shadow-sm p-3",
                      task.status === "done" && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {task.project?.name}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium text-foreground",
                            task.status === "done" && "line-through"
                          )}
                        >
                          {task.title}
                        </p>
                      </div>
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          TASK_STATUS_BADGE_CLASS[task.status]
                        )}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </span>
                      {task.due_date ? (
                        <span
                          className={cn(
                            "text-xs",
                            overdue ? "font-medium text-red-600" : "text-muted-foreground"
                          )}
                        >
                          Due {task.due_date}
                          {overdue ? " (overdue)" : ""}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
