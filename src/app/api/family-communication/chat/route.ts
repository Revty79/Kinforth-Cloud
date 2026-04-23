import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyChatMessage } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import {
  isValidChatMessage,
  maxChatMessageLength,
  normalizeSingleLineText,
  type FamilyChatMessageItem,
} from "@/lib/family-communication";

type CreateChatMessageBody = {
  message?: unknown;
};

function toFamilyChatMessageItem(
  row: typeof familyChatMessage.$inferSelect,
): FamilyChatMessageItem {
  return {
    id: row.id,
    message: row.message,
    sentByName: row.sentByName,
    sentByUserId: row.sentByUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateChatMessageBody;
  try {
    payload = (await request.json()) as CreateChatMessageBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messageRaw = typeof payload.message === "string" ? payload.message : "";
  const message = normalizeSingleLineText(messageRaw);

  if (!isValidChatMessage(message)) {
    return NextResponse.json(
      {
        error: `Message must be 1-${maxChatMessageLength} characters.`,
      },
      { status: 400 },
    );
  }

  const sentByName =
    normalizeSingleLineText(session.user.name ?? "") ||
    session.user.email ||
    "Family member";

  const [created] = await db
    .insert(familyChatMessage)
    .values({
      id: crypto.randomUUID(),
      sentByUserId: session.user.id,
      sentByName,
      message,
    })
    .returning();

  return NextResponse.json({
    message: toFamilyChatMessageItem(created),
  });
}
