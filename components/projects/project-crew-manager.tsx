"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { assignEmployee, unassignEmployee } from "@/actions/projects";

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
}

export function ProjectCrewManager({
  projectId,
  assigned,
  available,
}: {
  projectId: string;
  assigned: EmployeeOption[];
  available: EmployeeOption[];
}) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    if (!selectedId) return;
    startTransition(async () => {
      const result = await assignEmployee(projectId, selectedId);
      if (!result.ok) {
        toast.error(result.error);
      } else {
        setSelectedId("");
      }
    });
  }

  function onRemove(profileId: string) {
    startTransition(async () => {
      const result = await unassignEmployee(projectId, profileId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {assigned.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nobody&apos;s assigned to this job yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {assigned.map((employee) => (
            <li
              key={employee.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {initials(employee.firstName, employee.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => onRemove(employee.id)}
              >
                <UserMinus className="mr-1.5 h-4 w-4" />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <div className="flex items-center gap-2">
          <Select
            value={selectedId}
            onValueChange={(value) => setSelectedId(value ?? "")}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Add an employee…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAdd} disabled={!selectedId || isPending}>
            Add
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Everyone in the company is already assigned to this job.
        </p>
      )}
    </div>
  );
}
