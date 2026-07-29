import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_CLASS,
} from "@/lib/domain/projects";
import type { ProjectStatus } from "@/types/database";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", PROJECT_STATUS_BADGE_CLASS[status])}
    >
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  );
}
