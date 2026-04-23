import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { choreItem } from "@/db/schema";
import { getSession } from "@/lib/auth-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const choreId = params.id;

  const [deleted] = await db
    .delete(choreItem)
    .where(eq(choreItem.id, choreId))
    .returning({ id: choreItem.id });

  if (!deleted) {
    return NextResponse.json({ error: "Chore not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
