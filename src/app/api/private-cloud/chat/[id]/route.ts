import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { privateCloudChatMessage } from "@/db/schema";
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
    .delete(privateCloudChatMessage)
    .where(
      and(
        eq(privateCloudChatMessage.id, messageId),
        eq(privateCloudChatMessage.sentByUserId, session.user.id),
      ),
    )
    .returning({ id: privateCloudChatMessage.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "Message not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
