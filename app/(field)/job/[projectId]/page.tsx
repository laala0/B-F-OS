import { ComingSoon } from "@/components/shared/coming-soon";

export default async function FieldJobPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await params;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold text-neutral-900">Job</h1>
      <ComingSoon
        title="Job site view"
        phase="Phase 2 (Projects)"
        description="A read-only slice of this project for crew: site address, your tasks, and the photo feed."
      />
    </div>
  );
}
