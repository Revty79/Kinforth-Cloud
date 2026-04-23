import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyChatMessage } from "@/db/schema";
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
  const messageId = params.id;

  const [deleted] = await db
    .delete(familyChatMessage)
    .where(
      and(
        eq(familyChatMessage.id, messageId),
        eq(familyChatMessage.sentByUserId, session.user.id),
      ),
    )
    .returning({ id: familyChatMessage.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "Message not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
