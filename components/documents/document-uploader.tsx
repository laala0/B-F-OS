"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { confirmDocumentUpload } from "@/actions/documents";
import { DOCUMENT_CATEGORIES } from "@/lib/validation/media";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/domain/documents";
import type { DocumentCategory } from "@/types/database";

export function DocumentUploader({
  projectId,
  companyId,
}: {
  projectId: string;
  companyId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [isUploading, setIsUploading] = useState(false);

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const path = `${companyId}/${projectId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        toast.error(`Couldn't upload ${file.name}.`);
        continue;
      }

      const result = await confirmDocumentUpload(projectId, {
        storagePath: path,
        originalFilename: file.name,
        category,
        contentType: file.type,
        sizeBytes: file.size,
      });
      if (!result.ok) toast.error(result.error);
    }

    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={category} onValueChange={(v) => v && setCategory(v as DocumentCategory)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DOCUMENT_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {DOCUMENT_CATEGORY_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
        multiple
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
      <Button type="button" disabled={isUploading} onClick={() => inputRef.current?.click()}>
        <Upload className="mr-1.5 h-4 w-4" />
        {isUploading ? "Uploading…" : "Upload document"}
      </Button>
    </div>
  );
}
