import { ComingSoon } from "@/components/shared/coming-soon";

export default function CapturePage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold text-neutral-900">Capture</h1>
      <ComingSoon
        title="Camera capture"
        phase="Phase 5 (Media)"
        description="Take a photo or video straight from the job site — it uploads directly to storage and converts automatically so it's viewable in the office."
      />
    </div>
  );
}
