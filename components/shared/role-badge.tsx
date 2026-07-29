import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

const LABELS: Record<UserRole, string> = {
  admin: "Boss",
  employee: "Friend",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        role === "admin" &&
          "border border-gold/30 bg-gold/15 text-[color-mix(in_oklch,var(--gold),black_25%)] dark:text-gold"
      )}
    >
      {LABELS[role]}
    </Badge>
  );
}
