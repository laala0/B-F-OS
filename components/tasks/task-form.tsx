"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createTask, updateTask } from "@/actions/tasks";
import {
  taskSchema,
  TASK_PRIORITIES,
  UNASSIGNED,
  type TaskInput,
} from "@/lib/validation/tasks";
import { TASK_PRIORITY_LABELS } from "@/lib/domain/tasks";
import type { Task, TaskChecklistItem } from "@/types/database";

type EmployeeOption = { id: string; firstName: string; lastName: string };

function defaultValuesFor(
  task?: Task,
  checklistItems?: TaskChecklistItem[]
): TaskInput {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    priority: task?.priority ?? "medium",
    dueDate: task?.due_date ?? "",
    assignedTo: task?.assigned_to ?? UNASSIGNED,
    checklist:
      checklistItems?.map((item) => ({
        id: item.id,
        label: item.label,
        isDone: item.is_done,
      })) ?? [],
  };
}

export function TaskForm({
  projectId,
  employees,
  task,
  checklistItems,
  onSuccess,
}: {
  projectId: string;
  employees: EmployeeOption[];
  task?: Task;
  checklistItems?: TaskChecklistItem[];
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const mode = task ? "edit" : "create";

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValuesFor(task, checklistItems),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "checklist",
  });

  function applyFieldErrors(fieldErrors?: Record<string, string[]>) {
    if (!fieldErrors) return;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      form.setError(field as keyof TaskInput, { message: messages?.[0] });
    }
  }

  function onSubmit(values: TaskInput) {
    startTransition(async () => {
      if (mode === "create") {
        const result = await createTask(projectId, values);
        if (!result.ok) {
          toast.error(result.error);
          applyFieldErrors(result.fieldErrors);
          return;
        }
        toast.success("Task created.");
        onSuccess();
        return;
      }

      const result = await updateTask(task!.id, values);
      if (!result.ok) {
        toast.error(result.error);
        applyFieldErrors(result.fieldErrors);
        return;
      }
      toast.success("Changes saved.");
      onSuccess();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Pour footings — north wall" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {TASK_PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigned to</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Checklist</FormLabel>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`checklist.${index}.isDone`}
                  render={({ field: checkField }) => (
                    <Checkbox
                      checked={checkField.value}
                      onCheckedChange={checkField.onChange}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name={`checklist.${index}.label`}
                  render={({ field: labelField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Checklist item" {...labelField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: "", isDone: false })}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add item
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving…"
              : mode === "create"
                ? "Create task"
                : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
