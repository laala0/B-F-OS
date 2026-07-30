"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectOption = { id: string; name: string };

/**
 * "Which job am I looking at?" picker, shared by the field Notes and Capture
 * screens. It re-navigates the CURRENT route with ?project=<id> — deliberately
 * derived from usePathname() rather than hardcoded, because this used to live in
 * components/notes as NoteProjectSelect with a literal "/notes?project=" and
 * quietly threw anyone who changed jobs on the Capture screen over to Notes.
 */
export function ProjectFilterSelect({
  projectId,
  projects,
}: {
  projectId: string;
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Base UI resolves the trigger's label from `items`; without it the closed
  // trigger prints the raw value, which here is a bare project UUID.
  const items = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  return (
    <Select
      items={items}
      value={projectId}
      onValueChange={(v) => v && router.replace(`${pathname}?project=${v}`)}
    >
      <SelectTrigger className="h-11 w-full text-base">
        <SelectValue placeholder="Which job?" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
