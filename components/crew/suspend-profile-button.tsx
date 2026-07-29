"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { suspendProfile, reactivateProfile } from "@/actions/crew";
import type { ProfileStatus } from "@/types/database";

export function SuspendProfileButton({
  profileId,
  status,
}: {
  profileId: string;
  status: ProfileStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const suspended = status === "suspended";

  function onClick() {
    startTransition(async () => {
      const result = suspended
        ? await reactivateProfile(profileId)
        : await suspendProfile(profileId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={onClick}
      className={suspended ? "" : "text-red-600 hover:text-red-700"}
    >
      {isPending ? "Saving…" : suspended ? "Reactivate" : "Suspend"}
    </Button>
  );
}
