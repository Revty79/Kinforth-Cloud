import { mkdir, unlink, writeFile } from "node:fs/promises";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyFile } from "@/db/schema";
import {
  getFamilyFileCategoryLabel,
  isAllowedFamilyFileMimeType,
  isFamilyFileCategory,
  maxFamilyFileSizeBytes,
  normalizeFamilyUploadMimeType,
  type FamilyFileItem,
} from "@/lib/family-files";
import {
  getFamilyFileDownloadUrl,
  getFamilyFileExtension,
  getFamilyFilesUploadDirectory,
  resolveFamilyFilePath,
  sanitizeOriginalFileName,
} from "@/lib/family-file-storage";
import { getSession } from "@/lib/auth-session";

export const runtime = "nodejs";

function toFamilyFileItem(row: typeof familyFile.$inferSelect): FamilyFileItem {
  return {
    id: row.id,
    title: row.title,
    originalName: row.originalName,
    fileUrl: row.fileUrl,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    category: row.category as FamilyFileItem["category"],
    createdAt: row.createdAt.toISOString(),
  };
}

function getUploadFailureMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "EACCES" || error.code === "EPERM")
  ) {
    return "Upload storage is unavailable on the server right now.";
  }

  return "Could not upload this file right now. Please try again in a moment.";
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(familyFile)
    .orderBy(desc(familyFile.createdAt));

  return NextResponse.json({
    files: rows.map(toFamilyFileItem),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }

    const rawTitle = formData.get("title");
    const rawCategory = formData.get("category");
    const rawFile = formData.get("file");

    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    const category = typeof rawCategory === "string" ? rawCategory.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!isFamilyFileCategory(category)) {
      return NextResponse.json(
        {
          error: `Category is invalid. Use one of: ${getFamilyFileCategoryLabel("document")}, ${getFamilyFileCategoryLabel("photo")}, ${getFamilyFileCategoryLabel("record")}, ${getFamilyFileCategoryLabel("vault")}.`,
        },
        { status: 400 },
      );
    }

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        { error: "A file upload is required." },
        { status: 400 },
      );
    }

    if (rawFile.size <= 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 },
      );
    }

    if (rawFile.size > maxFamilyFileSizeBytes) {
      return NextResponse.json(
        {
          error: `File is too large. Maximum size is ${Math.floor(
            maxFamilyFileSizeBytes / (1024 * 1024),
          )} MB.`,
        },
        { status: 400 },
      );
    }

    const originalName = sanitizeOriginalFileName(rawFile.name);
    const normalizedMimeType = normalizeFamilyUploadMimeType(
      rawFile.type,
      originalName,
    );

    if (!isAllowedFamilyFileMimeType(normalizedMimeType)) {
      return NextResponse.json(
        {
          error:
            "This file type is not supported yet. Use common image, PDF, text, Word, Excel, or PowerPoint formats.",
        },
        { status: 400 },
      );
    }

    const extension = getFamilyFileExtension(originalName) || ".bin";
    const fileId = crypto.randomUUID();
    const storedName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const fileUrl = getFamilyFileDownloadUrl(fileId);
    const uploadDirectory = getFamilyFilesUploadDirectory();
    const storedFilePath = resolveFamilyFilePath(storedName);

    await mkdir(uploadDirectory, { recursive: true });
    const fileBuffer = Buffer.from(await rawFile.arrayBuffer());
    await writeFile(storedFilePath, fileBuffer);

    try {
      const [created] = await db
        .insert(familyFile)
        .values({
          id: fileId,
          uploadedByUserId: session.user.id,
          title,
          originalName,
          storedName,
          fileUrl,
          mimeType: normalizedMimeType,
          sizeBytes: rawFile.size,
          category,
        })
        .returning();

      return NextResponse.json({
        file: toFamilyFileItem(created),
      });
    } catch {
      await unlink(storedFilePath).catch(() => null);
      return NextResponse.json(
        { error: "Could not save this file right now." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Family file upload failed.", error);
    return NextResponse.json(
      {
        error: getUploadFailureMessage(error),
      },
      { status: 500 },
    );
  }
}
