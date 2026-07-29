import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/database";

const LABELS: Record<UserRole, string> = {
  admin: "Admin",
  employee: "Employee",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant="secondary">{LABELS[role]}</Badge>;
}
