import { ComingSoon } from "@/components/shared/coming-soon";

export default function TimesheetsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Timesheets</h1>
      <ComingSoon
        title="Approval queue"
        phase="Phase 3 (Time Tracking)"
        description="Every clock-in/out, flagged automatically for missed clock-outs, GPS issues, or shifts over 12 hours — approve or correct before it locks in for payroll."
      />
    </div>
  );
}
