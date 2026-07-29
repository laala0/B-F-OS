import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/shared/coming-soon";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TASK_STATUS_LABELS, TASK_STATUS_BADGE_CLASS, isOverdue } from "@/lib/domain/tasks";
import { cn } from "@/lib/utils";

export default async function TodayPage() {
  const user = await requireRole("admin", "employee");
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, project:projects(name)")
    .eq("assigned_to", user.id)
    .is("deleted_at", null);

  const priorityWeight = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...(tasks ?? [])].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const aOverdue = isOverdue(a.due_date, a.status);
    const bOverdue = isOverdue(b.due_date, b.status);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold text-neutral-900">
        Hey {user.profile.first_name}
      </h1>

      <ComingSoon
        title="Clock in / out"
        phase="Phase 3 (Time Tracking)"
        description="Not built yet — this pass covers assigned tasks below, not the clock."
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-900">Your tasks</p>
        {sorted.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nothing&apos;s assigned to you right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((task) => {
              const overdue = isOverdue(task.due_date, task.status);
              return (
                <li key={task.id}>
                  <Link
                    href={`/tasks/${task.id}`}
                    className={cn(
                      "block rounded-lg border border-neutral-200 bg-white p-3",
                      task.status === "done" && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-neutral-400">
                          {task.project?.name}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-medium text-neutral-900",
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
                            overdue ? "font-medium text-red-600" : "text-neutral-500"
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
