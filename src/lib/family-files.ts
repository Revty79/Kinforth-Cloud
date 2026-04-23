export const familyFileCategories = [
  "document",
  "photo",
  "record",
  "vault",
] as const;

export type FamilyFileCategory = (typeof familyFileCategories)[number];

export type FamilyFileItem = {
  id: string;
  title: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  category: FamilyFileCategory;
  createdAt: string;
};

export const maxFamilyFileSizeBytes = 15 * 1024 * 1024;

const allowedFamilyFileMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/pjpeg",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function isFamilyFileCategory(value: string): value is FamilyFileCategory {
  return familyFileCategories.includes(value as FamilyFileCategory);
}

export function isAllowedFamilyFileMimeType(value: string) {
  return allowedFamilyFileMimeTypes.has(value);
}

export function normalizeFamilyUploadMimeType(mimeType: string, fileName: string) {
  const normalizedType = mimeType.trim().toLowerCase();
  if (normalizedType && normalizedType !== "application/octet-stream") {
    return normalizedType;
  }

  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const inferredByExtension: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    heic: "image/heic",
    heif: "image/heif",
    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };

  return inferredByExtension[extension] ?? normalizedType;
}

export function getFamilyFileCategoryLabel(category: FamilyFileCategory) {
  const labels: Record<FamilyFileCategory, string> = {
    document: "Special docs",
    photo: "Photos",
    record: "Records",
    vault: "Vault prep",
  };

  return labels[category];
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
