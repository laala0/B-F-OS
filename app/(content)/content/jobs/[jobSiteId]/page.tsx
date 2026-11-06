/* eslint-disable @next/next/no-img-element -- signed Storage URLs */
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { STAGE_LABELS } from "@/lib/validation/content";
import { JobSiteForm } from "./job-site-form";

// One job's story, form to finish, with the facts only LAALA can confirm.
export default async function JobPage({ params }: { params: Promise<{ jobSiteId: string }> }) {
  const { jobSiteId } = await params;
  await requireRole("admin");
  const supabase = await createClient();

  const { data: site } = await supabase.from("job_sites").select("*").eq("id", jobSiteId).maybeSingle();
  if (!site) notFound();

  const [{ data: assets }, { data: caseFile }] = await Promise.all([
    supabase
      .from("content_assets")
      .select("id, thumb_path, taken_at, stage, review_status")
      .eq("job_site_id", jobSiteId)
      .neq("review_status", "skipped")
      .order("taken_at"),
    supabase.from("case_files").select("*").eq("job_site_id", jobSiteId).maybeSingle(),
  ]);

  const paths = (assets ?? []).map((a) => a.thumb_path).filter((p): p is string => Boolean(p));
  const { data: signed } = paths.length
    ? await supabase.storage.from("content").createSignedUrls(paths, 3600)
    : { data: [] };
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const story = caseFile
    ? (["problem", "constraints", "options", "decision", "result", "dollars"] as const).filter((k) => caseFile[k])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase">{site.label}</h1>
        <p className="text-[#a5a29b]">
          {site.first_date}
          {site.last_date !== site.first_date ? ` to ${site.last_date}` : ""}
          {site.city ? ` · ${site.city}` : ""}
        </p>
        {site.scope ? <p className="mt-2 max-w-2xl">{site.scope}</p> : null}
      </div>

      <JobSiteForm site={site} />

      {story.length > 0 && caseFile ? (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-xl uppercase">Case file</h2>
          <dl className="mt-2 space-y-2">
            {story.map((key) => (
              <div key={key}>
                <dt className="text-sm font-semibold capitalize text-[#ff8340]">{key}</dt>
                <dd>{caseFile[key]}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-xl uppercase">Photos by date</h2>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(assets ?? []).map((asset) => {
            const url = asset.thumb_path ? urls.get(asset.thumb_path) : null;
            return (
              <li key={asset.id} className="bg-[#1d2125]">
                {url ? (
                  <img src={url} alt={asset.stage ?? "Job photo"} loading="lazy" className="aspect-square w-full object-cover" />
                ) : null}
                <p className="p-2 text-xs text-[#a5a29b]">
                  {asset.taken_at?.slice(0, 10)}
                  {asset.stage ? ` · ${STAGE_LABELS[asset.stage]}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
