import { ProjectNav } from "@/components/projects/project-nav";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-6">
      <ProjectNav projectId={projectId} />
      <ComingSoon
        title="Documents"
        phase="Phase 5 (Media)"
        description="Drawings, permits, contracts, and quotes — versioned, so an old drawing revision never gets poured from by mistake."
      />
    </div>
  );
}
