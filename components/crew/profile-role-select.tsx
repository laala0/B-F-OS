"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileRole } from "@/actions/crew";
import type { UserRole } from "@/types/database";

export function ProfileRoleSelect({
  profileId,
  role,
}: {
  profileId: string;
  role: UserRole;
}) {
  const [isPending, startTransition] = useTransition();

  function onChange(next: string | null) {
    if (!next) return;
    startTransition(async () => {
      const result = await updateProfileRole(profileId, next);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-[160px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Boss (admin)</SelectItem>
        <SelectItem value="employee">Friend (employee)</SelectItem>
      </SelectContent>
    </Select>
  );
}
