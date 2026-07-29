"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTaskStatus } from "@/actions/tasks";
import { TASK_STATUSES } from "@/lib/validation/tasks";
import { TASK_STATUS_LABELS } from "@/lib/domain/tasks";
import type { TaskStatus } from "@/types/database";

export function TaskStatusSelect({
  taskId,
  status,
  size = "sm",
}: {
  taskId: string;
  status: TaskStatus;
  size?: "sm" | "default";
}) {
  const [isPending, startTransition] = useTransition();

  function onChange(next: string | null) {
    if (!next) return;
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, next);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Select value={status} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger size={size} className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {TASK_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
