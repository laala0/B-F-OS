import { requireProjectAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/projects/project-nav";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProjectActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await requireProjectAccess(projectId);
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("activity_events")
    .select("id, event_type, description, created_at, actor:profiles(first_name, last_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <ProjectNav projectId={projectId} />

      {!events || events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing&apos;s happened on this job yet — clock-ins, photos,
            notes, and status changes will show up here.
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="w-32 shrink-0 text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-foreground">
                    {event.description}
                    {event.actor && !event.description.startsWith(event.actor.first_name) ? (
                      <span className="text-muted-foreground">
                        {" "}
                        — {event.actor.first_name} {event.actor.last_name}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
