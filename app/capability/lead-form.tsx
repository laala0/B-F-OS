"use client";

import { useState, useTransition } from "react";
import { submitLead } from "@/actions/leads";
import { LEAD_ROLES, type SubmitLeadInput } from "@/lib/validation/leads";

const field =
  "w-full border border-[#3a3f44] bg-[#1d2125] px-3 py-3 text-base text-[#f4f1ea] placeholder:text-[#8b9096] focus:border-[#ff6b1a] focus:outline-none";

export function LeadForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as unknown as SubmitLeadInput;
    startTransition(async () => {
      const result = await submitLead(data);
      if (result.ok) setSent(true);
      else setError(result.fieldErrors ? Object.values(result.fieldErrors).flat()[0] ?? result.error : result.error);
    });
  }

  if (sent) {
    return (
      <p className="border-l-4 border-[#ff6b1a] pl-4 text-lg text-[#f4f1ea]">
        Got it. We&apos;ll look at the problem and get back to you.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Your name
        <input name="name" required autoComplete="name" className={field} />
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        You are
        <select name="role" required defaultValue="Engineer" className={field}>
          {LEAD_ROLES.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Email
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Phone (optional)
        <input name="phone" type="tel" autoComplete="tel" className={field} />
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Company (optional)
        <input name="organization" autoComplete="organization" className={field} />
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        City (optional)
        <input name="city" className={field} />
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf] sm:col-span-2">
        What&apos;s the problem?
        <textarea name="problem" required rows={5} className={field} />
      </label>
      {/* Honeypot: off-screen for people, tempting for bots. */}
      <label className="absolute left-[-9999px]" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-[#ff9d66] sm:col-span-2">
          {error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-[#ff6b1a] px-6 py-3 text-base font-semibold text-[#15181b] transition-colors hover:bg-[#ff8340] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b1a] disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send the problem"}
        </button>
        <p className="mt-3 text-sm text-[#8b9096]">We only use this to reply to you.</p>
      </div>
    </form>
  );
}
