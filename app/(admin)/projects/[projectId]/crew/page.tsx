import { requireProjectAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/projects/project-nav";
import { ProjectCrewManager } from "@/components/projects/project-crew-manager";

export default async function ProjectCrewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user, project } = await requireProjectAccess(projectId);
  const supabase = await createClient();

  const [{ data: assignments }, { data: employees }] = await Promise.all([
    supabase
      .from("project_assignments")
      .select("profile_id, profiles(id, first_name, last_name, email)")
      .eq("project_id", projectId),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("company_id", user.profile.company_id)
      .eq("role", "employee")
      .is("deleted_at", null)
      .order("first_name"),
  ]);

  const assigned = (assignments ?? [])
    .map((a) => a.profiles)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
    }));

  const assignedIds = new Set(assigned.map((p) => p.id));
  const available = (employees ?? [])
    .filter((p) => !assignedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email,
    }));

  return (
    <div className="max-w-2xl space-y-6">
      <ProjectNav projectId={projectId} />
      <h1 className="text-xl font-semibold text-neutral-900">
        Crew — {project.name}
      </h1>
      <ProjectCrewManager
        projectId={projectId}
        assigned={assigned}
        available={available}
      />
    </div>
  );
}
