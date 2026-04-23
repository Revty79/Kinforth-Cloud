import { unlink } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyFile } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import { resolveFamilyFilePath } from "@/lib/family-file-storage";

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
      id: familyFile.id,
      storedName: familyFile.storedName,
    })
    .from(familyFile)
    .where(eq(familyFile.id, fileId))
    .limit(1);

  if (!fileRow) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  await db.delete(familyFile).where(eq(familyFile.id, fileId));

  try {
    const filePath = resolveFamilyFilePath(fileRow.storedName);
    await unlink(filePath);
  } catch {
    // Ignore missing file cleanup errors after DB delete.
  }

  return NextResponse.json({ success: true });
}
