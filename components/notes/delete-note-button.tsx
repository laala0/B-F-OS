"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteNote } from "@/actions/notes";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await deleteNote(noteId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={onClick}
      className="text-neutral-400 hover:text-red-600"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
