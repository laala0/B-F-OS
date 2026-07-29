"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toggleChecklistItem } from "@/actions/tasks";

export function ChecklistItemToggle({
  itemId,
  label,
  isDone,
}: {
  itemId: string;
  label: string;
  isDone: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onCheckedChange(checked: boolean) {
    startTransition(async () => {
      const result = await toggleChecklistItem(itemId, checked);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <label className="flex items-center gap-2.5 py-1.5">
      <Checkbox
        checked={isDone}
        onCheckedChange={onCheckedChange}
        disabled={isPending}
      />
      <span
        className={cn(
          "text-sm",
          isDone ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {label}
      </span>
    </label>
  );
}
