import type { PhaseStatus } from "@/types/database";

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

export const PHASE_STATUS_BADGE_CLASS: Record<PhaseStatus, string> = {
  not_started: "bg-neutral-100 text-neutral-500",
  in_progress: "bg-sky-100 text-sky-700",
  complete: "bg-green-100 text-green-700",
};
