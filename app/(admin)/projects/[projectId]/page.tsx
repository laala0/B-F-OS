import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/projects/project-nav";
import { ProjectForm } from "@/components/projects/project-form";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <ProjectNav projectId={projectId} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">
          {project.name}
        </h1>
        <DeleteProjectDialog projectId={project.id} projectName={project.name} />
      </div>
      <ProjectForm project={project} />
      <ComingSoon
        title="Timeline & phases"
        phase="a later Phase 2 pass"
        description="Footings, base prep, rebar, anchors, pour, waterproofing — with planned vs. actual dates. Not part of this pass (create/edit/delete/assign/status)."
      />
    </div>
  );
}
