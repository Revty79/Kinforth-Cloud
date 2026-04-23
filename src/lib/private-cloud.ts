export const privateCloudFileCategories = [
  "document",
  "photo",
  "record",
  "vault",
] as const;

export type PrivateCloudFileCategory = (typeof privateCloudFileCategories)[number];

export type PrivateCloudFileItem = {
  id: string;
  title: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  category: PrivateCloudFileCategory;
  createdAt: string;
};

export type PrivateCloudStorageSummary = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
};

export type PrivateCloudChatMessageItem = {
  id: string;
  message: string;
  sentByName: string;
  sentByUserId: string;
  recipientUserId: string;
  createdAt: string;
};

export type PrivateCloudChatParticipant = {
  id: string;
  name: string;
  email: string;
};

export const maxPrivateCloudFileSizeBytes = 15 * 1024 * 1024;
export const defaultPrivateCloudStorageLimitBytes = 5 * 1024 * 1024 * 1024;
export const maxPrivateChatMessageLength = 500;

const allowedPrivateCloudFileMimeTypes = new Set([
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

export function isPrivateCloudFileCategory(
  value: string,
): value is PrivateCloudFileCategory {
  return privateCloudFileCategories.includes(value as PrivateCloudFileCategory);
}

export function isAllowedPrivateCloudFileMimeType(value: string) {
  return allowedPrivateCloudFileMimeTypes.has(value);
}

export function normalizePrivateCloudUploadMimeType(
  mimeType: string,
  fileName: string,
) {
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

export function getPrivateCloudFileCategoryLabel(category: PrivateCloudFileCategory) {
  const labels: Record<PrivateCloudFileCategory, string> = {
    document: "Documents",
    photo: "Photos",
    record: "Records",
    vault: "Vault",
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

  if (sizeBytes < 1024 * 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function normalizeSingleLineText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidPrivateChatMessage(value: string) {
  return value.length >= 1 && value.length <= maxPrivateChatMessageLength;
}

export function buildPrivateStorageSummary(usedBytes: number): PrivateCloudStorageSummary {
  return buildPrivateStorageSummaryWithLimit(
    usedBytes,
    defaultPrivateCloudStorageLimitBytes,
  );
}

export function buildPrivateStorageSummaryWithLimit(
  usedBytes: number,
  limitBytes: number,
): PrivateCloudStorageSummary {
  const normalizedUsedBytes = Math.max(0, usedBytes);
  const normalizedLimitBytes = Math.max(0, limitBytes);
  const remainingBytes = Math.max(0, normalizedLimitBytes - normalizedUsedBytes);

  return {
    usedBytes: normalizedUsedBytes,
    limitBytes: normalizedLimitBytes,
    remainingBytes,
  };
}
