"use client";

import { useTransition } from "react";
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
import { updateCompany } from "@/actions/company";
import { companySchema, CANADIAN_TIMEZONES, type CompanyInput } from "@/lib/validation/company";
import type { Company } from "@/types/database";

const TIMEZONE_LABELS: Record<(typeof CANADIAN_TIMEZONES)[number], string> = {
  "America/Vancouver": "Pacific — Vancouver",
  "America/Edmonton": "Mountain — Edmonton",
  "America/Regina": "Central (no DST) — Regina",
  "America/Winnipeg": "Central — Winnipeg",
  "America/Toronto": "Eastern — Toronto",
  "America/Halifax": "Atlantic — Halifax",
  "America/St_Johns": "Newfoundland — St. John's",
};

export function CompanyForm({ company }: { company: Company }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      legalName: company.legal_name ?? "",
      gstNumber: company.gst_number ?? "",
      address: company.address ?? "",
      timezone: (company.timezone as CompanyInput["timezone"]) ?? "America/Vancouver",
      defaultHoldbackPct: String(company.default_holdback_pct),
    },
  });

  function onSubmit(values: CompanyInput) {
    startTransition(async () => {
      const result = await updateCompany(values);
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof CompanyInput, {
              message: messages?.[0],
            });
          }
        }
        return;
      }
      toast.success("Settings saved.");
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gstNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST number</FormLabel>
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
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CANADIAN_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {TIMEZONE_LABELS[tz]}
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
            name="defaultHoldbackPct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default holdback %</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" max="100" inputMode="decimal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
