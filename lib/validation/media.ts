import { z } from "zod";

export const confirmMediaSchema = z.object({
  storagePath: z.string().min(1),
  contentType: z.string().optional(),
  sizeBytes: z.number().optional(),
  caption: z.string().trim().optional(),
});
export type ConfirmMediaInput = z.infer<typeof confirmMediaSchema>;

export const DOCUMENT_CATEGORIES = ["drawing", "permit", "contract", "quote", "other"] as const;

export const confirmDocumentSchema = z.object({
  storagePath: z.string().min(1),
  originalFilename: z.string().min(1),
  category: z.enum(DOCUMENT_CATEGORIES),
  contentType: z.string().optional(),
  sizeBytes: z.number().optional(),
});
export type ConfirmDocumentInput = z.infer<typeof confirmDocumentSchema>;
