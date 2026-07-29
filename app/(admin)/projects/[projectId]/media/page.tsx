import { requireProjectAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/projects/project-nav";
import { MediaUploader } from "@/components/media/media-uploader";
import { DeleteMediaButton } from "@/components/media/delete-media-button";

export default async function ProjectMediaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await requireProjectAccess(projectId);
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("media")
    .select("id, storage_path, content_type, caption, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const withUrls = await Promise.all(
    (items ?? []).map(async (item) => {
      const { data: signed } = await supabase.storage
        .from("media")
        .createSignedUrl(item.storage_path, 3600);
      return { ...item, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <ProjectNav projectId={projectId} />

      <MediaUploader projectId={projectId} companyId={user.profile.company_id} />

      {withUrls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-sm text-neutral-500">No photos or videos yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {withUrls.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
            >
              {item.url ? (
                item.content_type?.startsWith("video") ? (
                  <video src={item.url} controls className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.caption ?? ""}
                    className="h-full w-full object-cover"
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                  Unavailable
                </div>
              )}
              <DeleteMediaButton mediaId={item.id} projectId={projectId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
