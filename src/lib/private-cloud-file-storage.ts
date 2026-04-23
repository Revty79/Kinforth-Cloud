import path from "node:path";

function getFamilyCloudStorageRootDirectory() {
  const configuredRoot = process.env.FAMILY_CLOUD_STORAGE_DIR?.trim();
  if (!configuredRoot) {
    return path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "storage",
    );
  }

  if (path.isAbsolute(configuredRoot)) {
    return configuredRoot;
  }

  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    configuredRoot,
  );
}

export function getPrivateCloudFilesUploadDirectory() {
  return path.join(getFamilyCloudStorageRootDirectory(), "private-cloud-files");
}

export function getPrivateCloudFileDownloadUrl(fileId: string) {
  return `/api/private-cloud/files/${fileId}/download`;
}

export function getPrivateCloudFileExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

export function sanitizeOriginalFileName(value: string) {
  const withoutPath = path.basename(value);
  const sanitized = withoutPath.replace(/[^\w.\-() ]+/g, "_").trim();

  if (!sanitized) {
    return "file";
  }

  return sanitized.slice(0, 160);
}

export function resolvePrivateCloudFilePath(storedName: string) {
  const baseDirectory = path.resolve(getPrivateCloudFilesUploadDirectory());
  const resolvedPath = path.resolve(path.join(baseDirectory, storedName));

  if (
    resolvedPath !== baseDirectory &&
    !resolvedPath.startsWith(`${baseDirectory}${path.sep}`)
  ) {
    throw new Error("Invalid file path.");
  }

  return resolvedPath;
}
