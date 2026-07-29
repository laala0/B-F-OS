import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { formatCents } from "@/lib/domain/money";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, name, client_name, gc_company, status, contract_value_cents")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Projects</h1>
        <Link href="/projects/new" className={buttonVariants()}>
          New project
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center">
          <p className="text-sm text-neutral-500">No projects yet.</p>
          <Link
            href="/projects/new"
            className={buttonVariants({ variant: "outline", className: "mt-4" })}
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>GC</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Contract value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.code}
                    </Link>
                  </TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell className="text-neutral-500">
                    {project.client_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {project.gc_company ?? "—"}
                  </TableCell>
                  <TableCell>
                    <ProjectStatusSelect
                      projectId={project.id}
                      status={project.status}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCents(project.contract_value_cents)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Edit
                      </Link>
                      <DeleteProjectDialog
                        projectId={project.id}
                        projectName={project.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
