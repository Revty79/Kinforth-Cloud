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

export function getFamilyFilesUploadDirectory() {
  return path.join(getFamilyCloudStorageRootDirectory(), "family-files");
}

export function getFamilyFileDownloadUrl(fileId: string) {
  return `/api/family-files/${fileId}/download`;
}

export function getFamilyFileExtension(fileName: string) {
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

export function resolveFamilyFilePath(storedName: string) {
  const baseDirectory = path.resolve(getFamilyFilesUploadDirectory());
  const resolvedPath = path.resolve(path.join(baseDirectory, storedName));

  if (
    resolvedPath !== baseDirectory &&
    !resolvedPath.startsWith(`${baseDirectory}${path.sep}`)
  ) {
    throw new Error("Invalid file path.");
  }

  return resolvedPath;
}
