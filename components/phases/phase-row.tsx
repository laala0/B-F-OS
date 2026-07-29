"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PhaseFormDialog } from "@/components/phases/phase-form-dialog";
import { movePhase, deletePhase } from "@/actions/phases";
import { PHASE_STATUS_LABELS, PHASE_STATUS_BADGE_CLASS } from "@/lib/domain/phases";
import type { ProjectPhase } from "@/types/database";

export function PhaseRow({
  phase,
  projectId,
  isFirst,
  isLast,
}: {
  phase: ProjectPhase;
  projectId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onMove(direction: "up" | "down") {
    startTransition(async () => {
      const result = await movePhase(phase.id, projectId, direction);
      if (!result.ok) toast.error(result.error);
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deletePhase(phase.id, projectId);
      if (!result.ok) toast.error(result.error);
    });
  }

  const dates = [phase.planned_start, phase.planned_end].filter(Boolean).join(" → ");

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={isPending || isFirst}
            onClick={() => onMove("up")}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={isPending || isLast}
            onClick={() => onMove("down")}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">{phase.name}</p>
          {dates ? <p className="text-xs text-neutral-500">{dates}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn("border-transparent font-medium", PHASE_STATUS_BADGE_CLASS[phase.status])}
        >
          {PHASE_STATUS_LABELS[phase.status]}
        </Badge>
        <PhaseFormDialog
          projectId={projectId}
          phase={phase}
          trigger={
            <Button variant="ghost" size="icon-sm">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="text-red-600 hover:text-red-700" />
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &ldquo;{phase.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the phase entirely — there&apos;s no undo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
