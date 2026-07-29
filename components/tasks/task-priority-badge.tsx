import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_BADGE_CLASS,
} from "@/lib/domain/tasks";
import type { TaskPriority } from "@/types/database";

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", TASK_PRIORITY_BADGE_CLASS[priority])}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
