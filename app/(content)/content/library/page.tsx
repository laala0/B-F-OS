/* eslint-disable @next/next/no-img-element -- signed Storage URLs */
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { BRAND_LABELS, CONTENT_BRANDS, CONTENT_STAGES, STAGE_LABELS } from "@/lib/validation/content";
import type { ContentBrand, ContentStage, JobSiteEra } from "@/types/database";

const ERAS: { value: JobSiteEra; label: string }[] = [
  { value: "ontario_drywall_reno", label: "Ontario: drywall and reno" },
  { value: "vancouver_concrete", label: "Vancouver: concrete" },
];
const PAGE_SIZE = 60;
const field = "border border-[#3a3f44] bg-[#1d2125] px-2 py-2 text-sm text-[#f4f1ea]";

// Everything, by date, job, stage, company and era. Filters live in the URL so a
// view can be bookmarked; a plain GET form keeps it working without any client JS.
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; brand?: string; era?: string; site?: string; from?: string; to?: string; status?: string }>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const supabase = await createClient();
  const status = params.status === "all" ? "all" : params.status === "skipped" ? "skipped" : params.status === "pending" ? "pending" : "kept";

  const { data: sites } = await supabase
    .from("job_sites")
    .select("id, label, era, first_date")
    .is("deleted_at", null)
    .order("first_date");

  let query = supabase
    .from("content_assets")
    .select("id, thumb_path, taken_at, city, stage, brand, review_status, public_ok, job_site_id", { count: "exact" })
    .is("deleted_at", null)
    .order("taken_at", { ascending: true })
    .limit(PAGE_SIZE);

  if (status !== "all") query = query.eq("review_status", status);
  if (CONTENT_STAGES.includes(params.stage as ContentStage)) query = query.eq("stage", params.stage as ContentStage);
  if (CONTENT_BRANDS.includes(params.brand as ContentBrand)) query = query.eq("brand", params.brand as ContentBrand);
  if (params.site) query = query.eq("job_site_id", params.site);
  if (params.from) query = query.gte("taken_at", params.from);
  if (params.to) query = query.lte("taken_at", `${params.to}T23:59:59`);
  if (params.era) {
    const ids = (sites ?? []).filter((s) => s.era === params.era).map((s) => s.id);
    query = query.in("job_site_id", ids);
  }

  const { data: assets, count } = await query;
  const paths = (assets ?? []).map((a) => a.thumb_path).filter((p): p is string => Boolean(p));
  const { data: signed } = paths.length
    ? await supabase.storage.from("content").createSignedUrls(paths, 3600)
    : { data: [] };
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  const siteLabels = new Map((sites ?? []).map((s) => [s.id, s.label]));

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-2" action="/content/library">
        <label className="grid gap-1 text-xs text-[#a5a29b]">
          Show
          <select name="status" defaultValue={status} className={field}>
            <option value="kept">Kept</option>
            <option value="pending">Not reviewed</option>
            <option value="skipped">Skipped</option>
            <option value="all">Everything</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[#a5a29b]">
          Era
          <select name="era" defaultValue={params.era ?? ""} className={field}>
            <option value="">All</option>
            {ERAS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[#a5a29b]">
          Stage
          <select name="stage" defaultValue={params.stage ?? ""} className={field}>
            <option value="">All</option>
            {CONTENT_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[#a5a29b]">
          Whose work
          <select name="brand" defaultValue={params.brand ?? ""} className={field}>
            <option value="">All</option>
            {CONTENT_BRANDS.map((b) => (
              <option key={b} value={b}>
                {BRAND_LABELS[b]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[#a5a29b]">
          Job
          <select name="site" defaultValue={params.site ?? ""} className={`${field} max-w-52`}>
            <option value="">All</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_date?.slice(0, 7)} · {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[#a5a29b]">
          From
          <input type="date" name="from" defaultValue={params.from} className={field} />
        </label>
        <label className="grid gap-1 text-xs text-[#a5a29b]">
          To
          <input type="date" name="to" defaultValue={params.to} className={field} />
        </label>
        <button type="submit" className="min-h-10 bg-[#f4f1ea] px-4 text-sm font-semibold text-[#15181b]">
          Filter
        </button>
      </form>

      <p className="text-sm text-[#a5a29b]">
        {count ?? 0} photos{(count ?? 0) > PAGE_SIZE ? `, showing the first ${PAGE_SIZE}` : ""}
      </p>

      {(assets ?? []).length === 0 ? (
        <p className="border border-dashed border-[#3a3f44] py-16 text-center text-[#a5a29b]">
          Nothing here yet. <Link href="/content" className="underline">Review some photos</Link>.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(assets ?? []).map((asset) => {
            const url = asset.thumb_path ? urls.get(asset.thumb_path) : null;
            return (
              <li key={asset.id} className="bg-[#1d2125]">
                {url ? (
                  <img src={url} alt={asset.stage ?? "Job photo"} loading="lazy" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="aspect-square" />
                )}
                <div className="p-2 text-xs">
                  <p className="font-semibold">{asset.stage ? STAGE_LABELS[asset.stage] : "No stage"}</p>
                  <p className="text-[#a5a29b]">
                    {asset.taken_at?.slice(0, 10)} · {asset.city ?? "No GPS"}
                  </p>
                  <p className="truncate text-[#a5a29b]">
                    {asset.job_site_id ? siteLabels.get(asset.job_site_id) : "No job"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
