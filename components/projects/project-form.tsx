"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent } from "@/components/ui/card";
import { createProject, updateProject } from "@/actions/projects";
import {
  projectSchema,
  PROJECT_STATUSES,
  type ProjectInput,
} from "@/lib/validation/projects";
import { PROJECT_STATUS_LABELS } from "@/lib/domain/projects";
import type { Project } from "@/types/database";

// react-hook-form needs a plain string default for every field (including
// ones the schema will turn into a number/undefined) so inputs stay
// controlled — the zod schema does the string -> cents / string -> date
// coercion on submit, not on load.
function defaultValuesFor(project?: Project): ProjectInput {
  return {
    code: project?.code ?? "",
    name: project?.name ?? "",
    clientName: project?.client_name ?? "",
    gcCompany: project?.gc_company ?? "",
    siteAddress: project?.site_address ?? "",
    status: project?.status ?? "lead",
    contractValue:
      project?.contract_value_cents != null
        ? String(project.contract_value_cents / 100)
        : "",
    startDate: project?.start_date ?? "",
    targetEndDate: project?.target_end_date ?? "",
  };
}

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const mode = project ? "edit" : "create";

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultValuesFor(project),
  });

  function applyFieldErrors(fieldErrors?: Record<string, string[]>) {
    if (!fieldErrors) return;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      form.setError(field as keyof ProjectInput, { message: messages?.[0] });
    }
  }

  function onSubmit(values: ProjectInput) {
    startTransition(async () => {
      // Handled as two fully separate branches (rather than a shared
      // `result` typed as a union) so TypeScript can narrow `result.data`
      // in the create branch — it can't correlate "mode === create" with
      // which action actually produced a shared union-typed result.
      if (mode === "create") {
        const result = await createProject(values);
        if (!result.ok) {
          toast.error(result.error);
          applyFieldErrors(result.fieldErrors);
          return;
        }
        toast.success("Project created.");
        router.push(`/projects/${result.data.id}`);
        return;
      }

      const result = await updateProject(project!.id, values);
      if (!result.ok) {
        toast.error(result.error);
        applyFieldErrors(result.fieldErrors);
        return;
      }
      toast.success("Changes saved.");
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job code</FormLabel>
                    <FormControl>
                      <Input placeholder="40377-GARIBALDI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {PROJECT_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project name</FormLabel>
                  <FormControl>
                    <Input placeholder="Garibaldi Laneway Foundation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gcCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General contractor</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="siteAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract value ($ CAD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target end date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/projects")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving…"
                  : mode === "create"
                    ? "Create project"
                    : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
