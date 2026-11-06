import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const ERA_LABELS = {
  vancouver_concrete: "Vancouver: concrete",
  ontario_drywall_reno: "Ontario: drywall and renovation",
};

// Every job, newest era first. Addresses show here and nowhere public.
export default async function JobsPage() {
  await requireRole("admin");
  const supabase = await createClient();
  const [{ data: sites }, { data: assets }] = await Promise.all([
    supabase.from("job_sites").select("*").is("deleted_at", null).order("first_date", { ascending: false }),
    supabase.from("content_assets").select("job_site_id, review_status").is("deleted_at", null),
  ]);

  const counts = new Map<string, { total: number; kept: number }>();
  for (const asset of assets ?? []) {
    if (!asset.job_site_id) continue;
    const c = counts.get(asset.job_site_id) ?? { total: 0, kept: 0 };
    c.total += 1;
    if (asset.review_status === "kept") c.kept += 1;
    counts.set(asset.job_site_id, c);
  }

  return (
    <div className="space-y-8">
      {(["vancouver_concrete", "ontario_drywall_reno"] as const).map((era) => {
        const rows = (sites ?? []).filter((s) => s.era === era);
        return (
          <section key={era}>
            <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase">{ERA_LABELS[era]}</h1>
            <ul className="mt-2 divide-y divide-[#2a2e32]">
              {rows.map((site) => {
                const c = counts.get(site.id);
                return (
                  <li key={site.id}>
                    <Link href={`/content/jobs/${site.id}`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:bg-[#1d2125]">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{site.label}</span>
                        <span className="block truncate text-sm text-[#a5a29b]">
                          {site.first_date}
                          {site.last_date && site.last_date !== site.first_date ? ` to ${site.last_date}` : ""}
                          {site.performed_by ? ` · ${site.performed_by}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-sm text-[#a5a29b]">
                        {c ? `${c.total} photos` : "No photos"}
                        {!site.confirmed ? <span className="block text-[#ff8340]">Confirm</span> : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
