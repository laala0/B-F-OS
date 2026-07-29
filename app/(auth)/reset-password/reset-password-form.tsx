"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { requestPasswordReset } from "@/actions/auth";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: RequestPasswordResetInput) {
    startTransition(async () => {
      const result = await requestPasswordReset(values);
      if (result.ok) {
        setSent(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="font-medium text-foreground">Check your email</p>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for that address, we&apos;ve sent a link to
            reset your password.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      className="h-11 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="h-11 w-full text-base" disabled={isPending}>
              {isPending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
