import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhaseFormDialog } from "@/components/phases/phase-form-dialog";
import { PhaseRow } from "@/components/phases/phase-row";
import type { ProjectPhase } from "@/types/database";

export function PhaseList({
  projectId,
  phases,
}: {
  projectId: string;
  phases: ProjectPhase[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">Timeline &amp; phases</CardTitle>
        <PhaseFormDialog
          projectId={projectId}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="mr-1.5 h-4 w-4" />
              Add phase
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {phases.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Footings, base prep, rebar, anchors, pour, waterproofing — add the
            phases for this job.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {phases.map((phase, index) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                projectId={projectId}
                isFirst={index === 0}
                isLast={index === phases.length - 1}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
