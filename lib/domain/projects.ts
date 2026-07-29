import type { ProjectStatus } from "@/types/database";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  lead: "Lead",
  quoted: "Quoted",
  won: "Won",
  active: "Active",
  on_hold: "On Hold",
  complete: "Complete",
  archived: "Archived",
};

// Tailwind classes, not shadcn Badge variants — the default variant set
// (default/secondary/destructive/outline) can't express seven distinct
// lifecycle states.
export const PROJECT_STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  lead: "bg-slate-100 text-slate-700",
  quoted: "bg-sky-100 text-sky-700",
  won: "bg-violet-100 text-violet-700",
  active: "bg-green-100 text-green-700",
  on_hold: "bg-amber-100 text-amber-700",
  complete: "bg-blue-100 text-blue-700",
  archived: "bg-neutral-100 text-neutral-500",
};
