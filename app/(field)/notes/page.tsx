import { ComingSoon } from "@/components/shared/coming-soon";

export default function NotesPage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-semibold text-neutral-900">Daily notes</h1>
      <ComingSoon
        title="Daily notes"
        phase="Phase 4 (Tasks & Daily Notes)"
        description="Weather, crew count, and delays — one entry per job per day."
      />
    </div>
  );
}
