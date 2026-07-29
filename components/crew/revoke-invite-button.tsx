"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { revokeInvite } from "@/actions/crew";

export function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await revokeInvite(inviteId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={onClick}
      className="text-neutral-500 hover:text-red-600"
    >
      <X className="mr-1.5 h-4 w-4" />
      Revoke
    </Button>
  );
}
