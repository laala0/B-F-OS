import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompanyToday } from "@/lib/supabase/company";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { ChecklistItemToggle } from "@/components/tasks/checklist-item-toggle";
import { isOverdue } from "@/lib/domain/tasks";
import { cn } from "@/lib/utils";

export default async function FieldTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select(
      "id, title, description, priority, status, due_date, company_id, project:projects(name)"
    )
    .eq("id", taskId)
    .is("deleted_at", null)
    .single();

  if (!task) notFound();

  const { data: checklistItems } = await supabase
    .from("task_checklist_items")
    .select("id, label, is_done")
    .eq("task_id", taskId)
    .order("position");

  const today = await getCompanyToday(task.company_id);
  const overdue = isOverdue(task.due_date, task.status, today);

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-neutral-400">
          {task.project?.name}
        </p>
        <h1 className="text-lg font-semibold text-neutral-900">
          {task.title}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TaskPriorityBadge priority={task.priority} />
        {task.due_date ? (
          <span
            className={cn(
              "text-sm",
              overdue ? "font-medium text-red-600" : "text-neutral-500"
            )}
          >
            Due {task.due_date}
            {overdue ? " (overdue)" : ""}
          </span>
        ) : null}
      </div>

      {task.description ? (
        <p className="text-sm text-neutral-700">{task.description}</p>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-900">Status</p>
        <TaskStatusSelect taskId={task.id} status={task.status} size="default" />
      </div>

      {checklistItems && checklistItems.length > 0 ? (
        <div className="space-y-1 rounded-lg border border-neutral-200 bg-white p-3">
          <p className="pb-1 text-sm font-medium text-neutral-900">
            Checklist
          </p>
          {checklistItems.map((item) => (
            <ChecklistItemToggle
              key={item.id}
              itemId={item.id}
              label={item.label}
              isDone={item.is_done}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
