import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/projects/project-nav";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TaskStatusSelect } from "@/components/tasks/task-status-select";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";
import { isOverdue } from "@/lib/domain/tasks";
import { cn } from "@/lib/utils";
import type { Task, TaskChecklistItem } from "@/types/database";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireRole("admin");
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  const [{ data: tasks }, { data: employees }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("company_id", user.profile.company_id)
      .eq("role", "employee")
      .is("deleted_at", null)
      .order("first_name"),
  ]);

  const taskList: Task[] = tasks ?? [];
  const taskIds = taskList.map((t) => t.id);

  const { data: checklistItems } =
    taskIds.length > 0
      ? await supabase
          .from("task_checklist_items")
          .select("*")
          .in("task_id", taskIds)
          .order("position")
      : { data: [] as TaskChecklistItem[] };

  const checklistByTask = new Map<string, TaskChecklistItem[]>();
  for (const item of checklistItems ?? []) {
    const list = checklistByTask.get(item.task_id) ?? [];
    list.push(item);
    checklistByTask.set(item.task_id, list);
  }

  const employeeOptions = (employees ?? []).map((e) => ({
    id: e.id,
    firstName: e.first_name,
    lastName: e.last_name,
  }));
  const employeeById = new Map(employeeOptions.map((e) => [e.id, e]));

  return (
    <div className="max-w-4xl space-y-6">
      <ProjectNav projectId={projectId} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">
          Tasks — {project.name}
        </h1>
        <TaskFormSheet
          projectId={projectId}
          employees={employeeOptions}
          trigger={<button className={buttonVariants()}>New task</button>}
        />
      </div>

      {taskList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-sm text-neutral-500">No tasks yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskList.map((task) => {
                const items = checklistByTask.get(task.id) ?? [];
                const done = items.filter((i) => i.is_done).length;
                const assignee = task.assigned_to
                  ? employeeById.get(task.assigned_to)
                  : undefined;
                const overdue = isOverdue(task.due_date, task.status);

                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="text-neutral-500">
                      {assignee
                        ? `${assignee.firstName} ${assignee.lastName}`
                        : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <TaskPriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell
                      className={cn(overdue && "font-medium text-red-600")}
                    >
                      {task.due_date ?? "—"}
                      {overdue ? " (overdue)" : ""}
                    </TableCell>
                    <TableCell className="text-neutral-500">
                      {items.length > 0 ? `${done}/${items.length}` : "—"}
                    </TableCell>
                    <TableCell>
                      <TaskStatusSelect taskId={task.id} status={task.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <TaskFormSheet
                          projectId={projectId}
                          employees={employeeOptions}
                          task={task}
                          checklistItems={items}
                          trigger={
                            <button
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                            >
                              Edit
                            </button>
                          }
                        />
                        <DeleteTaskDialog
                          taskId={task.id}
                          projectId={projectId}
                          taskTitle={task.title}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
