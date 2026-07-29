"use client";

import { useState, type ReactElement } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TaskForm } from "@/components/tasks/task-form";
import type { Task, TaskChecklistItem } from "@/types/database";

type EmployeeOption = { id: string; firstName: string; lastName: string };

export function TaskFormSheet({
  projectId,
  employees,
  task,
  checklistItems,
  trigger,
}: {
  projectId: string;
  employees: EmployeeOption[];
  task?: Task;
  checklistItems?: TaskChecklistItem[];
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{task ? "Edit task" : "New task"}</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          <TaskForm
            projectId={projectId}
            employees={employees}
            task={task}
            checklistItems={checklistItems}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
