import Link from "next/link";
import { requireProjectAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { TASK_STATUS_LABELS, TASK_STATUS_BADGE_CLASS } from "@/lib/domain/tasks";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_BADGE_CLASS } from "@/lib/domain/projects";
import { cn } from "@/lib/utils";

export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user, project } = await requireProjectAccess(projectId);
  const supabase = await createClient();

  const [{ data: tasks }, { data: notes }, { data: media }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date")
      .eq("project_id", projectId)
      .eq("assigned_to", user.id)
      .is("deleted_at", null)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("daily_notes")
      .select("id, note, weather, log_date, created_at, author:profiles(first_name, last_name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("media")
      .select("id, storage_path, content_type")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const mediaWithUrls = await Promise.all(
    (media ?? []).map(async (item) => {
      const { data: signed } = await supabase.storage
        .from("media")
        .createSignedUrl(item.storage_path, 3600);
      return { ...item, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-neutral-900">{project.name}</h1>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              PROJECT_STATUS_BADGE_CLASS[project.status]
            )}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.site_address ? (
          <p className="text-sm text-neutral-500">{project.site_address}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-900">Your tasks here</p>
        {tasks && tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="block rounded-lg border border-neutral-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">{task.title}</p>
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      TASK_STATUS_BADGE_CLASS[task.status]
                    )}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">Nothing assigned to you on this job.</p>
        )}
      </div>

      {mediaWithUrls.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">Recent photos</p>
          <div className="grid grid-cols-3 gap-2">
            {mediaWithUrls.map((item) =>
              item.url ? (
                item.content_type?.startsWith("video") ? (
                  <video
                    key={item.id}
                    src={item.url}
                    className="aspect-square rounded-lg border border-neutral-200 object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={item.id}
                    src={item.url}
                    alt=""
                    className="aspect-square rounded-lg border border-neutral-200 object-cover"
                  />
                )
              ) : null
            )}
          </div>
        </div>
      ) : null}

      {notes && notes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-900">Recent notes</p>
          <div className="space-y-2">
            {notes.map((n) => (
              <Card key={n.id}>
                <CardContent className="space-y-1 pt-4">
                  <p className="text-xs text-neutral-500">
                    {new Date(n.created_at).toLocaleDateString()}
                    {n.weather ? ` · ${n.weather}` : ""} · {n.author?.first_name}{" "}
                    {n.author?.last_name}
                  </p>
                  <p className="text-sm text-neutral-900">{n.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
