import { ComingSoon } from "@/components/shared/coming-soon";

export default function CrewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Crew</h1>
      <ComingSoon
        title="Crew list"
        phase="Phase 1 (Company & Crew)"
        description="Invite crew members, set roles, and manage employment details. This is next up after auth."
      />
    </div>
  );
}
