"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMedia } from "@/actions/media";

export function DeleteMediaButton({
  mediaId,
  projectId,
}: {
  mediaId: string;
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await deleteMedia(mediaId, projectId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={onClick}
      className="absolute right-1 top-1 bg-black/50 text-white hover:bg-black/70 hover:text-white"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
