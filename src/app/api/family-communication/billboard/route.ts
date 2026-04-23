import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyBillboardPost } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import {
  isValidBillboardMessage,
  isValidBillboardTitle,
  maxBillboardMessageLength,
  maxBillboardTitleLength,
  normalizeMultiLineText,
  normalizeSingleLineText,
  type FamilyBillboardPostItem,
} from "@/lib/family-communication";

type CreateBillboardPostBody = {
  title?: unknown;
  message?: unknown;
};

function toFamilyBillboardPostItem(
  row: typeof familyBillboardPost.$inferSelect,
): FamilyBillboardPostItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    createdByName: row.createdByName,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateBillboardPostBody;
  try {
    payload = (await request.json()) as CreateBillboardPostBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const titleRaw = typeof payload.title === "string" ? payload.title : "";
  const messageRaw = typeof payload.message === "string" ? payload.message : "";

  const title = normalizeSingleLineText(titleRaw);
  const message = normalizeMultiLineText(messageRaw);

  if (!isValidBillboardTitle(title)) {
    return NextResponse.json(
      {
        error: `Title must be 3-${maxBillboardTitleLength} characters.`,
      },
      { status: 400 },
    );
  }

  if (!isValidBillboardMessage(message)) {
    return NextResponse.json(
      {
        error: `Message must be 3-${maxBillboardMessageLength} characters.`,
      },
      { status: 400 },
    );
  }

  const createdByName =
    normalizeSingleLineText(session.user.name ?? "") ||
    session.user.email ||
    "Family member";

  const [created] = await db
    .insert(familyBillboardPost)
    .values({
      id: crypto.randomUUID(),
      createdByUserId: session.user.id,
      createdByName,
      title,
      message,
    })
    .returning();

  return NextResponse.json({
    post: toFamilyBillboardPostItem(created),
  });
}
