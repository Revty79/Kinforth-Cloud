import { unlink } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { privateCloudFile } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import { resolvePrivateCloudFilePath } from "@/lib/private-cloud-file-storage";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const fileId = params.id;

  const [fileRow] = await db
    .select({
      id: privateCloudFile.id,
      storedName: privateCloudFile.storedName,
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

  await db
    .delete(privateCloudFile)
    .where(
      and(
        eq(privateCloudFile.id, fileId),
        eq(privateCloudFile.ownerUserId, session.user.id),
      ),
    );

  try {
    const filePath = resolvePrivateCloudFilePath(fileRow.storedName);
    await unlink(filePath);
  } catch {
    // Ignore missing file cleanup errors after DB delete.
  }

  return NextResponse.json({ success: true });
}
