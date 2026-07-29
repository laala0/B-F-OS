import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import type { TaskPriority } from "@/types/database";

export type ReportTaskRow = {
  id: string;
  title: string;
  projectName: string;
  assigneeName: string;
  priority: TaskPriority;
  dueDate?: string | null;
};

export function TaskListTable({
  tasks,
  emptyLabel,
  showDueDate = false,
}: {
  tasks: ReportTaskRow[];
  emptyLabel: string;
  showDueDate?: boolean;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Assigned to</TableHead>
          <TableHead>Priority</TableHead>
          {showDueDate ? <TableHead>Due date</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell className="font-medium">{task.title}</TableCell>
            <TableCell className="text-muted-foreground">{task.projectName}</TableCell>
            <TableCell className="text-muted-foreground">{task.assigneeName}</TableCell>
            <TableCell>
              <TaskPriorityBadge priority={task.priority} />
            </TableCell>
            {showDueDate ? (
              <TableCell className="font-medium text-red-600">
                {task.dueDate}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
