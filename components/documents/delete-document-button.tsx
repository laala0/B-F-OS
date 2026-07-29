"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDocument } from "@/actions/documents";

export function DeleteDocumentButton({
  documentId,
  projectId,
}: {
  documentId: string;
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await deleteDocument(documentId, projectId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={onClick}
      className="text-muted-foreground hover:text-red-600"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
