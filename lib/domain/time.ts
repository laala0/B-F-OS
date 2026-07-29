import type { TimeEntryStatus } from "@/types/database";

export const TIME_ENTRY_STATUS_LABELS: Record<TimeEntryStatus, string> = {
  open: "Clocked in",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export const TIME_ENTRY_STATUS_BADGE_CLASS: Record<TimeEntryStatus, string> = {
  open: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export function durationHours(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0;
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  return Math.max(0, ms / 3_600_000);
}

export function formatDuration(clockIn: string, clockOut: string | null): string {
  if (!clockOut) return "—";
  const hours = durationHours(clockIn, clockOut);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
