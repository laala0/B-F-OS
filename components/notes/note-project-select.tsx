"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectOption = { id: string; name: string };

export function NoteProjectSelect({
  projectId,
  projects,
}: {
  projectId: string;
  projects: ProjectOption[];
}) {
  const router = useRouter();

  return (
    <Select
      value={projectId}
      onValueChange={(v) => v && router.replace(`/notes?project=${v}`)}
    >
      <SelectTrigger className="w-full">
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
