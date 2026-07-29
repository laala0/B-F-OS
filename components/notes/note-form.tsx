"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { createNote } from "@/actions/notes";
import { createNoteSchema, type CreateNoteInput } from "@/lib/validation/notes";

export function NoteForm({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CreateNoteInput>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: { projectId, weather: "", crewCount: "", note: "" },
  });

  function onSubmit(values: CreateNoteInput) {
    startTransition(async () => {
      const result = await createNote({ ...values, projectId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Note added.");
      form.reset({ projectId, weather: "", crewCount: "", note: "" });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="weather"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weather</FormLabel>
                <FormControl>
                  <Input placeholder="Rain, 8°C" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="crewCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crew on site</FormLabel>
                <FormControl>
                  <Input type="number" min="0" inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Delays, deliveries, anything worth flagging…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Saving…" : "Add note"}
        </Button>
      </form>
    </Form>
  );
}
