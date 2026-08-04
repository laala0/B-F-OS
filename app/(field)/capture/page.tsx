import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProjectFilterSelect } from "@/components/shared/project-filter-select";
import { MediaUploader } from "@/components/media/media-uploader";
import { DeleteMediaButton } from "@/components/media/delete-media-button";

export default async function CapturePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: rawProjectId } = await searchParams;
  const user = await requireRole("admin", "employee");
  const supabase = await createClient();

  let projects: { id: string; name: string }[];
  // All users can capture photos to any active project in their company.
  // Assignment is not required for photo uploads.
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", user.profile.company_id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  projects = data ?? [];

  const projectId =
    rawProjectId && projects.some((p) => p.id === rawProjectId)
      ? rawProjectId
      : (projects[0]?.id ?? "");

  const { data: items } = projectId
    ? await supabase
        .from("media")
        .select("id, storage_path, content_type, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(12)
    : { data: [] };

  const withUrls = await Promise.all(
    (items ?? []).map(async (item) => {
      const { data: signed } = await supabase.storage
        .from("media")
        .createSignedUrl(item.storage_path, 3600);
      return { ...item, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold text-foreground">Capture</h1>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You&apos;re not assigned to any jobs yet.
        </p>
      ) : (
        <>
          <ProjectFilterSelect projectId={projectId} projects={projects} />
          <MediaUploader projectId={projectId} companyId={user.profile.company_id} capture />

          {withUrls.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {withUrls.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {item.url ? (
                    item.content_type?.startsWith("video") ? (
                      <video src={item.url} controls className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="" className="h-full w-full object-cover" />
                    )
                  ) : null}
                  <DeleteMediaButton mediaId={item.id} projectId={projectId} />
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
