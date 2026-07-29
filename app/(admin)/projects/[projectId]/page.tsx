import { requireProjectAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/projects/project-nav";
import { ProjectForm } from "@/components/projects/project-form";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { PhaseList } from "@/components/phases/phase-list";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { project } = await requireProjectAccess(projectId);
  const supabase = await createClient();

  const { data: phases } = await supabase
    .from("project_phases")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  return (
    <div className="max-w-2xl space-y-6">
      <ProjectNav projectId={projectId} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">
          {project.name}
        </h1>
        <DeleteProjectDialog projectId={project.id} projectName={project.name} />
      </div>
      <ProjectForm project={project} />
      <PhaseList projectId={projectId} phases={phases ?? []} />
    </div>
  );
}
