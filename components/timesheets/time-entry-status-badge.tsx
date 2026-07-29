import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TIME_ENTRY_STATUS_LABELS, TIME_ENTRY_STATUS_BADGE_CLASS } from "@/lib/domain/time";
import type { TimeEntryStatus } from "@/types/database";

export function TimeEntryStatusBadge({ status }: { status: TimeEntryStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", TIME_ENTRY_STATUS_BADGE_CLASS[status])}
    >
      {TIME_ENTRY_STATUS_LABELS[status]}
    </Badge>
  );
}
