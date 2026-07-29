import { ProjectNav } from "@/components/projects/project-nav";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function ProjectActivityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="space-y-6">
      <ProjectNav projectId={projectId} />
      <ComingSoon
        title="Activity feed"
        phase="Phase 6 (Activity Feed & Notifications)"
        description="A live log of everything that happened on this job — clock-ins, photos, notes, status changes — so you can see a day's work without calling anyone."
      />
    </div>
  );
}
