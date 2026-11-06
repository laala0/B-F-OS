"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateJobSite } from "@/actions/content";
import type { JobSite } from "@/types/database";

const field =
  "w-full border border-[#3a3f44] bg-[#1d2125] px-3 py-3 text-base text-[#f4f1ea] focus:border-[#ff6b1a] focus:outline-none";

export function JobSiteForm({ site }: { site: JobSite }) {
  const [address, setAddress] = useState(site.address ?? "");
  const [performedBy, setPerformedBy] = useState(site.performed_by ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateJobSite({ jobSiteId: site.id, address, performedBy, confirmed: true });
      if (result.ok) toast.success("Saved");
      else toast.error(result.error);
    });
  }

  return (
    <div className="grid gap-3 border border-[#2a2e32] p-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Job address (private, never public)
        <input value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" className={field} />
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Whose job was it?
        <input
          value={performedBy}
          onChange={(e) => setPerformedBy(e.target.value)}
          placeholder="GS Pumping, Key West, Form2Finish…"
          autoComplete="off"
          className={field}
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="min-h-11 bg-[#f4f1ea] px-5 font-semibold text-[#15181b] disabled:opacity-50"
        >
          {site.confirmed ? "Save" : "Confirm this job"}
        </button>
      </div>
    </div>
  );
}
