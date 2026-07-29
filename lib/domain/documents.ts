import type { DocumentCategory } from "@/types/database";

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  drawing: "Drawing",
  permit: "Permit",
  contract: "Contract",
  quote: "Quote",
  other: "Other",
};
