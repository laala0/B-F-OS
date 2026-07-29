import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { NoteProjectSelect } from "@/components/notes/note-project-select";
import { NoteForm } from "@/components/notes/note-form";
import { DeleteNoteButton } from "@/components/notes/delete-note-button";
import { Card, CardContent } from "@/components/ui/card";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: rawProjectId } = await searchParams;
  const user = await requireRole("admin", "employee");
  const supabase = await createClient();

  let projects: { id: string; name: string }[];
  if (user.profile.role === "admin") {
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .eq("company_id", user.profile.company_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    projects = data ?? [];
  } else {
    const { data } = await supabase
      .from("project_assignments")
      .select("project:projects(id, name)")
      .eq("profile_id", user.id);
    projects = (data ?? [])
      .map((a) => a.project)
      .filter((p): p is { id: string; name: string } => p != null);
  }
  const projectId =
    rawProjectId && projects.some((p) => p.id === rawProjectId)
      ? rawProjectId
      : (projects[0]?.id ?? "");

  const { data: notes } = projectId
    ? await supabase
        .from("daily_notes")
        .select("id, weather, crew_count, note, log_date, created_at, author:profiles(first_name, last_name)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold text-foreground">Daily notes</h1>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You&apos;re not assigned to any jobs yet.
        </p>
      ) : (
        <>
          <NoteProjectSelect projectId={projectId} projects={projects} />
          <NoteForm projectId={projectId} />

          <div className="space-y-2 pt-2">
            {(notes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet for this job.</p>
            ) : (
              (notes ?? []).map((n) => (
                <Card key={n.id}>
                  <CardContent className="space-y-1 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        {n.weather ? <span>· {n.weather}</span> : null}
                        {n.crew_count != null ? <span>· {n.crew_count} on site</span> : null}
                        <span>
                          · {n.author?.first_name} {n.author?.last_name}
                        </span>
                      </div>
                      <DeleteNoteButton noteId={n.id} />
                    </div>
                    <p className="text-sm text-foreground">{n.note}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
