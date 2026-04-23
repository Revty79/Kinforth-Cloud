import { and, asc, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { privateCloudChatMessage, user } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import {
  isValidPrivateChatMessage,
  maxPrivateChatMessageLength,
  normalizeSingleLineText,
  type PrivateCloudChatMessageItem,
} from "@/lib/private-cloud";

type CreatePrivateChatMessageBody = {
  message?: unknown;
  recipientUserId?: unknown;
};

function toPrivateChatMessageItem(
  row: typeof privateCloudChatMessage.$inferSelect,
): PrivateCloudChatMessageItem {
  return {
    id: row.id,
    message: row.message,
    sentByName: row.sentByName,
    sentByUserId: row.sentByUserId,
    recipientUserId: row.recipientUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const withUserId = requestUrl.searchParams.get("withUserId")?.trim() ?? "";

  if (!withUserId) {
    return NextResponse.json(
      { error: "withUserId is required." },
      { status: 400 },
    );
  }

  if (withUserId === session.user.id) {
    return NextResponse.json(
      { error: "Choose another user for private chat." },
      { status: 400 },
    );
  }

  const [recipientRow] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, withUserId))
    .limit(1);

  if (!recipientRow) {
    return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(privateCloudChatMessage)
    .where(
      or(
        and(
          eq(privateCloudChatMessage.sentByUserId, session.user.id),
          eq(privateCloudChatMessage.recipientUserId, withUserId),
        ),
        and(
          eq(privateCloudChatMessage.sentByUserId, withUserId),
          eq(privateCloudChatMessage.recipientUserId, session.user.id),
        ),
      ),
    )
    .orderBy(asc(privateCloudChatMessage.createdAt));

  return NextResponse.json({
    messages: rows.map(toPrivateChatMessageItem),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreatePrivateChatMessageBody;
  try {
    payload = (await request.json()) as CreatePrivateChatMessageBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messageRaw = typeof payload.message === "string" ? payload.message : "";
  const recipientUserId =
    typeof payload.recipientUserId === "string"
      ? payload.recipientUserId.trim()
      : "";
  const message = normalizeSingleLineText(messageRaw);

  if (!recipientUserId) {
    return NextResponse.json(
      { error: "Recipient is required." },
      { status: 400 },
    );
  }

  if (recipientUserId === session.user.id) {
    return NextResponse.json(
      { error: "Choose another user for private chat." },
      { status: 400 },
    );
  }

  const [recipientRow] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, recipientUserId))
    .limit(1);

  if (!recipientRow) {
    return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
  }

  if (!isValidPrivateChatMessage(message)) {
    return NextResponse.json(
      {
        error: `Message must be 1-${maxPrivateChatMessageLength} characters.`,
      },
      { status: 400 },
    );
  }

  const sentByName =
    normalizeSingleLineText(session.user.name ?? "") ||
    session.user.email ||
    "Private user";

  const [created] = await db
    .insert(privateCloudChatMessage)
    .values({
      id: crypto.randomUUID(),
      ownerUserId: session.user.id,
      sentByUserId: session.user.id,
      recipientUserId,
      sentByName,
      message,
    })
    .returning();

  return NextResponse.json({
    message: toPrivateChatMessageItem(created),
  });
}
