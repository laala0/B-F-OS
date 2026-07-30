"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTimeEntry } from "@/actions/time";
import {
  createTimeEntrySchema,
  NO_PROJECT,
  type CreateTimeEntryInput,
} from "@/lib/validation/time";

type CrewOption = { id: string; name: string };
type ProjectOption = { id: string; name: string };

export function AddTimeEntryDialog({
  crew,
  projects,
}: {
  crew: CrewOption[];
  projects: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Base UI resolves the trigger's label from `items`. Without it the closed
  // trigger has no mounted SelectItem to read, so it falls back to printing
  // the raw value — i.e. the user sees "__none__" instead of "No specific job".
  const crewItems = Object.fromEntries(crew.map((c) => [c.id, c.name]));
  const jobItems = {
    [NO_PROJECT]: "No specific job",
    ...Object.fromEntries(projects.map((p) => [p.id, p.name])),
  };

  const form = useForm<CreateTimeEntryInput>({
    resolver: zodResolver(createTimeEntrySchema),
    defaultValues: {
      profileId: "",
      projectId: NO_PROJECT,
      clockIn: "",
      clockOut: "",
      notes: "",
    },
  });

  function onSubmit(values: CreateTimeEntryInput) {
    // Same timezone reasoning as TimeEntryActions: datetime-local hands back a
    // timezone-naive string, so resolve it against the browser's timezone (the
    // one the admin actually meant) before the server — running in UTC — sees it.
    startTransition(async () => {
      const result = await createTimeEntry({
        ...values,
        clockIn: new Date(values.clockIn).toISOString(),
        clockOut: new Date(values.clockOut).toISOString(),
      });
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof CreateTimeEntryInput, {
              message: messages?.[0],
            });
          }
        }
        return;
      }
      toast.success("Entry added — approve it like any other.");
      form.reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add entry
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add time entry</DialogTitle>
          <DialogDescription>
            For hours the app didn&apos;t catch — no signal on site, dead phone,
            or someone forgot to clock in. Lands as pending for your approval.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="profileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crew member</FormLabel>
                  <Select
                    items={crewItems}
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Who worked?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {crew.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job</FormLabel>
                  <Select
                    items={jobItems}
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PROJECT}>No specific job</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="clockIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Started</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clockOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finished</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="e.g. no signal in the parkade, texted me the hours"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Adding…" : "Add entry"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
