"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, X, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { approveTimeEntry, rejectTimeEntry, adjustTimeEntry } from "@/actions/time";
import { adjustTimeEntrySchema, type AdjustTimeEntryInput } from "@/lib/validation/time";
import type { TimeEntry } from "@/types/database";

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function TimeEntryActions({ entry }: { entry: TimeEntry }) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const form = useForm<AdjustTimeEntryInput>({
    resolver: zodResolver(adjustTimeEntrySchema),
    defaultValues: {
      clockIn: toLocalInputValue(entry.clock_in),
      clockOut: entry.clock_out ? toLocalInputValue(entry.clock_out) : "",
      notes: entry.notes ?? "",
    },
  });

  function onApprove() {
    startTransition(async () => {
      const result = await approveTimeEntry(entry.id);
      if (!result.ok) toast.error(result.error);
    });
  }

  function onReject() {
    startTransition(async () => {
      const result = await rejectTimeEntry(entry.id);
      if (!result.ok) toast.error(result.error);
    });
  }

  function onAdjust(values: AdjustTimeEntryInput) {
    // datetime-local inputs give a timezone-naive string ("2026-01-01T08:00")
    // that means whatever timezone reads it — the browser here, but the
    // server action runs on Vercel in UTC. Converting with `new Date(...)`
    // in the browser resolves it against the browser's own timezone (the
    // one the admin actually meant) before it becomes an unambiguous ISO
    // string, so the server doesn't have to guess.
    startTransition(async () => {
      const result = await adjustTimeEntry(entry.id, {
        clockIn: new Date(values.clockIn).toISOString(),
        clockOut: values.clockOut ? new Date(values.clockOut).toISOString() : undefined,
        notes: values.notes,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry updated.");
      setEditOpen(false);
    });
  }

  return (
    <div className="flex justify-end gap-1">
      {entry.status === "pending" ? (
        <>
          <Button variant="outline" size="sm" disabled={isPending} onClick={onApprove}>
            <Check className="mr-1 h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onReject}
            className="text-red-600 hover:text-red-700"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reject
          </Button>
        </>
      ) : null}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <Pencil className="h-3.5 w-3.5" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit time entry</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAdjust)} className="space-y-4">
              <FormField
                control={form.control}
                name="clockIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock in</FormLabel>
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
                    <FormLabel>Clock out</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving…" : "Save & set to pending"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
