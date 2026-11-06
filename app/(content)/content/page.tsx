/* eslint-disable @next/next/no-img-element -- signed Storage URLs */
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ReviewControls } from "./review-controls";

// One photo at a time. Oldest first, so the story reads form to finish.
export default async function ReviewPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: asset }, { count: left }, { count: kept }, { data: sites }] = await Promise.all([
    supabase
      .from("content_assets")
      .select("*")
      .eq("review_status", "pending")
      .is("deleted_at", null)
      .order("taken_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("content_assets").select("id", { count: "exact", head: true }).eq("review_status", "pending"),
    supabase.from("content_assets").select("id", { count: "exact", head: true }).eq("review_status", "kept"),
    supabase.from("job_sites").select("id, label, first_date").is("deleted_at", null).order("first_date"),
  ]);

  if (!asset) {
    return (
      <div className="py-20 text-center">
        <p className="font-[family-name:var(--font-display)] text-4xl uppercase">All caught up</p>
        <p className="mt-2 text-[#a5a29b]">
          {kept ? `${kept} photos kept. ` : ""}New job photos show up here after the next gallery sweep.
        </p>
      </div>
    );
  }

  const { data: signed } = await supabase.storage.from("content").createSignedUrl(asset.thumb_path ?? "", 3600);
  const when = asset.taken_at
    ? new Date(asset.taken_at).toLocaleDateString("en-CA", { dateStyle: "medium", timeZone: "America/Vancouver" })
    : "No date";

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <div>
        {signed?.signedUrl ? (
          <img
            src={signed.signedUrl}
            alt={`Job photo from ${asset.city ?? "unknown place"}, ${when}`}
            className="max-h-[70vh] w-full bg-black object-contain"
          />
        ) : (
          <p className="py-20 text-center text-[#a5a29b]">Photo unavailable.</p>
        )}
        <p className="mt-2 text-sm text-[#a5a29b]">
          {when} · {asset.city ?? "No GPS"} · {left ?? 0} left
        </p>
      </div>
      <ReviewControls key={asset.id} asset={asset} sites={sites ?? []} />
    </div>
  );
}
