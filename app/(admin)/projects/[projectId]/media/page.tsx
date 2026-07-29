import { ProjectNav } from "@/components/projects/project-nav";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function ProjectMediaPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-6">
      <ProjectNav projectId={projectId} />
      <ComingSoon
        title="Photos & videos"
        phase="Phase 5 (Media)"
        description="Site photos and videos, converted from iPhone HEIC automatically so they render in any browser."
      />
    </div>
  );
}
