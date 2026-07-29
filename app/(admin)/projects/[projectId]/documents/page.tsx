import { requireProjectAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ProjectNav } from "@/components/projects/project-nav";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/domain/documents";

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await requireProjectAccess(projectId);
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, storage_path, original_filename, category, version, size_bytes, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const withUrls = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 3600, { download: doc.original_filename });
      return { ...doc, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-6">
      <ProjectNav projectId={projectId} />

      <DocumentUploader projectId={projectId} companyId={user.profile.company_id} />

      {withUrls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withUrls.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    {doc.url ? (
                      <a href={doc.url} className="hover:underline" target="_blank" rel="noreferrer">
                        {doc.original_filename}
                      </a>
                    ) : (
                      doc.original_filename
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{DOCUMENT_CATEGORY_LABELS[doc.category]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">v{doc.version}</TableCell>
                  <TableCell className="text-muted-foreground">{formatSize(doc.size_bytes)}</TableCell>
                  <TableCell className="text-right">
                    <DeleteDocumentButton documentId={doc.id} projectId={projectId} />
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
