import { readFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { privateCloudFile } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import {
  resolvePrivateCloudFilePath,
  sanitizeOriginalFileName,
} from "@/lib/private-cloud-file-storage";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

function buildContentDisposition(fileName: string, asDownload: boolean) {
  const safeFileName = sanitizeOriginalFileName(fileName);
  const fallbackName = safeFileName.replace(/"/g, "");
  const encodedName = encodeURIComponent(safeFileName);
  const disposition = asDownload ? "attachment" : "inline";

  return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
}

export async function GET(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const fileId = params.id;

  const [fileRow] = await db
    .select({
      storedName: privateCloudFile.storedName,
      originalName: privateCloudFile.originalName,
      mimeType: privateCloudFile.mimeType,
      sizeBytes: privateCloudFile.sizeBytes,
    })
    .from(privateCloudFile)
    .where(
      and(
        eq(privateCloudFile.id, fileId),
        eq(privateCloudFile.ownerUserId, session.user.id),
      ),
    )
    .limit(1);

  if (!fileRow) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const asDownload = requestUrl.searchParams.get("download") === "1";

  try {
    const filePath = resolvePrivateCloudFilePath(fileRow.storedName);
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": fileRow.mimeType,
        "Content-Length": String(fileRow.sizeBytes),
        "Content-Disposition": buildContentDisposition(
          fileRow.originalName,
          asDownload,
        ),
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk." }, { status: 404 });
  }
}
