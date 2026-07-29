"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { confirmMediaUpload } from "@/actions/media";

export function MediaUploader({
  projectId,
  companyId,
  capture = false,
}: {
  projectId: string;
  companyId: string;
  capture?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const path = `${companyId}/${projectId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        toast.error(`Couldn't upload ${file.name}.`);
        continue;
      }

      const result = await confirmMediaUpload(projectId, {
        storagePath: path,
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
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple={!capture}
        capture={capture ? "environment" : undefined}
        className="hidden"
        onChange={(e) => onFilesSelected(e.target.files)}
      />
      <Button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        {isUploading ? "Uploading…" : "Upload photos/videos"}
      </Button>
    </div>
  );
}
