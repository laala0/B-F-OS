"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { updateEmploymentRecord } from "@/actions/crew";
import {
  employmentRecordSchema,
  EMPLOYMENT_TYPES,
  type EmploymentRecordInput,
} from "@/lib/validation/crew";
import type { EmploymentRecord } from "@/types/database";

const EMPLOYMENT_TYPE_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  hourly: "Hourly",
  salary: "Salary",
  contract: "Contract",
};

export function EmploymentRecordForm({
  profileId,
  record,
}: {
  profileId: string;
  record: EmploymentRecord | null;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<EmploymentRecordInput>({
    resolver: zodResolver(employmentRecordSchema),
    defaultValues: {
      hourlyRate:
        record?.hourly_rate_cents != null ? String(record.hourly_rate_cents / 100) : "",
      overtimeRate:
        record?.overtime_rate_cents != null
          ? String(record.overtime_rate_cents / 100)
          : "",
      employmentType: (record?.employment_type as EmploymentRecordInput["employmentType"]) ?? "hourly",
      hiredOn: record?.hired_on ?? "",
      notes: record?.notes ?? "",
    },
  });

  function onSubmit(values: EmploymentRecordInput) {
    startTransition(async () => {
      const result = await updateEmploymentRecord(profileId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Wage details saved.");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hourlyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hourly rate ($ CAD)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="overtimeRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overtime rate ($ CAD)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {EMPLOYMENT_TYPE_LABELS[t]}
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
            name="hiredOn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hired on</FormLabel>
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certifications / notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save wage details"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
