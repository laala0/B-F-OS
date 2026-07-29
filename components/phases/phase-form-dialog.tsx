"use client";

import { useState, type ReactElement } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createPhase, updatePhase } from "@/actions/phases";
import { phaseSchema, PHASE_STATUSES, type PhaseInput } from "@/lib/validation/phases";
import { PHASE_STATUS_LABELS } from "@/lib/domain/phases";
import type { ProjectPhase } from "@/types/database";

export function PhaseFormDialog({
  projectId,
  phase,
  trigger,
}: {
  projectId: string;
  phase?: ProjectPhase;
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const mode = phase ? "edit" : "create";

  const form = useForm<PhaseInput>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      name: phase?.name ?? "",
      status: phase?.status ?? "not_started",
      plannedStart: phase?.planned_start ?? "",
      plannedEnd: phase?.planned_end ?? "",
      actualStart: phase?.actual_start ?? "",
      actualEnd: phase?.actual_end ?? "",
    },
  });

  function onSubmit(values: PhaseInput) {
    (async () => {
      const result =
        mode === "create"
          ? await createPhase(projectId, values)
          : await updatePhase(phase!.id, projectId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(mode === "create" ? "Phase added." : "Changes saved.");
      setOpen(false);
      form.reset();
    })();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add phase" : "Edit phase"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Footings" {...field} />
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
                  <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PHASE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PHASE_STATUS_LABELS[s]}
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
                name="plannedStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plannedEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned end</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="actualStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual start</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actualEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual end</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              {mode === "create" ? "Add phase" : "Save changes"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
