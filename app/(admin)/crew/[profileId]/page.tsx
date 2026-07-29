import { ComingSoon } from "@/components/shared/coming-soon";

export default async function CrewMemberPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  await params;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Crew member</h1>
      <ComingSoon
        title="Profile & employment details"
        phase="Phase 1 (Company & Crew)"
        description="Wage rate, certifications, and assigned projects. Wage rates live in a separate table admins can see — never employees."
      />
    </div>
  );
}
