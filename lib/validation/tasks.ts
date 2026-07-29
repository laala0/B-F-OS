import { z } from "zod";

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

// Sentinel for "no assignee" — Base UI's Select doesn't accept an empty
// string as an item value, and the form needs a real value to bind to.
export const UNASSIGNED = "unassigned";

const optionalText = z.string().trim().optional();

const checklistItemSchema = z.object({
  // Present for an existing row (used to reconcile update vs. insert vs.
  // delete in actions/tasks.ts); absent for a new item added in the form.
  id: z.string().optional(),
  label: z.string().trim().min(1, "Checklist item can't be empty").max(200),
  isDone: z.boolean(),
});
export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalText,
  priority: z.enum(TASK_PRIORITIES),
  dueDate: optionalText,
  assignedTo: z.string().optional(),
  checklist: z.array(checklistItemSchema).max(50),
});
export type TaskInput = z.infer<typeof taskSchema>;

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export const toggleChecklistItemSchema = z.object({
  isDone: z.boolean(),
});
