"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reviewPhoto } from "@/actions/content";
import {
  BRAND_LABELS,
  CONTENT_BRANDS,
  CONTENT_STAGES,
  STAGE_LABELS,
} from "@/lib/validation/content";
import type { ContentAsset, ContentBrand, ContentStage } from "@/types/database";

const FLAG_LABELS: Record<string, string> = {
  person: "Person in shot: get their OK first",
  text_visible: "Text in shot: check for an address or a name",
  client_home: "Client's home: hold unless the owner agrees",
  house_number: "House number visible",
  street_sign: "Street sign visible",
  licence_plate: "Licence plate visible",
  builder_sign: "Builder sign visible: hold until they agree",
  face: "Face visible: get their OK first",
};

const field =
  "w-full border border-[#3a3f44] bg-[#1d2125] px-3 py-3 text-base text-[#f4f1ea] focus:border-[#ff6b1a] focus:outline-none";

export function ReviewControls({
  asset,
  sites,
}: {
  asset: ContentAsset;
  sites: { id: string; label: string; first_date: string | null }[];
}) {
  const [stage, setStage] = useState<ContentStage>(asset.stage ?? "other");
  const [brand, setBrand] = useState<ContentBrand>(asset.brand);
  const [site, setSite] = useState(asset.job_site_id ?? "");
  const [notes, setNotes] = useState(asset.notes ?? "");
  const blocked = asset.privacy_flags.length > 0;
  const [publicOk, setPublicOk] = useState(!blocked);
  const [pending, startTransition] = useTransition();

  function submit(action: "keep" | "skip") {
    startTransition(async () => {
      const result = await reviewPhoto({
        assetId: asset.id,
        action,
        stage,
        brand,
        jobSiteId: site || undefined,
        publicOk: action === "keep" && publicOk,
        notes: notes || undefined,
      });
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("skip")}
          className="min-h-14 border border-[#5a5f64] text-lg font-semibold transition-colors hover:border-[#f4f1ea] disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("keep")}
          className="min-h-14 bg-[#ff6b1a] text-lg font-semibold text-[#15181b] transition-colors hover:bg-[#ff8340] disabled:opacity-50"
        >
          Keep
        </button>
      </div>

      {asset.privacy_flags.length > 0 ? (
        <ul className="border-l-4 border-[#ff6b1a] pl-3 text-sm text-[#ffb68c]">
          {asset.privacy_flags.map((flag) => (
            <li key={flag}>{FLAG_LABELS[flag] ?? flag}</li>
          ))}
        </ul>
      ) : null}

      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Stage
        <select value={stage} onChange={(e) => setStage(e.target.value as ContentStage)} className={field}>
          {CONTENT_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Whose work
        <select value={brand} onChange={(e) => setBrand(e.target.value as ContentBrand)} className={field}>
          {CONTENT_BRANDS.map((b) => (
            <option key={b} value={b}>
              {BRAND_LABELS[b]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Job
        <select value={site} onChange={(e) => setSite(e.target.value)} className={field}>
          <option value="">No job</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_date?.slice(0, 7)} · {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Note
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's the story here?" className={field} />
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={publicOk}
          onChange={(e) => setPublicOk(e.target.checked)}
          className="size-5 accent-[#ff6b1a]"
        />
        OK to post publicly
      </label>
    </div>
  );
}
