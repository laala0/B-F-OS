"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { clockIn, clockOut } from "@/actions/time";
import { NO_PROJECT } from "@/lib/validation/time";
import type { TimeEntry } from "@/types/database";

type ProjectOption = { id: string; name: string };

function formatElapsed(since: string): string {
  const ms = Date.now() - new Date(since).getTime();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function ClockWidget({
  openEntry,
  projects,
}: {
  openEntry: TimeEntry | null;
  projects: ProjectOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState<string>(NO_PROJECT);
  const [notes, setNotes] = useState("");
  const [elapsed, setElapsed] = useState(() =>
    openEntry ? formatElapsed(openEntry.clock_in) : ""
  );

  useEffect(() => {
    if (!openEntry) return;
    setElapsed(formatElapsed(openEntry.clock_in));
    const id = setInterval(() => setElapsed(formatElapsed(openEntry.clock_in)), 30_000);
    return () => clearInterval(id);
  }, [openEntry]);

  function onClockIn() {
    startTransition(async () => {
      const result = await clockIn({ projectId });
      if (!result.ok) toast.error(result.error);
    });
  }

  function onClockOut() {
    if (!openEntry) return;
    startTransition(async () => {
      const result = await clockOut(openEntry.id, { notes });
      if (!result.ok) toast.error(result.error);
      else setNotes("");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {openEntry ? (
          <>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Clocked in</p>
                <p className="text-xs text-muted-foreground">
                  Since {new Date(openEntry.clock_in).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })} · {elapsed}
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Notes for this shift (optional)"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isPending}
              onClick={onClockOut}
            >
              {isPending ? "Clocking out…" : "Clock out"}
            </Button>
          </>
        ) : (
          <>
            {projects.length > 0 ? (
              <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Which job?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT}>No specific job</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button className="w-full" disabled={isPending} onClick={onClockIn}>
              <Clock className="mr-1.5 h-4 w-4" />
              {isPending ? "Clocking in…" : "Clock in"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
