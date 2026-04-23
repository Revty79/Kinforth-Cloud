import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { choreItem } from "@/db/schema";
import {
  isValidChoreTitle,
  normalizeChoreTitle,
  type ChoreItem,
} from "@/lib/chore-calendar";
import { getSession } from "@/lib/auth-session";

type CreateChoreBody = {
  title?: unknown;
};

function toChoreItem(row: typeof choreItem.$inferSelect): ChoreItem {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chores = await db
    .select()
    .from(choreItem)
    .orderBy(asc(choreItem.title), asc(choreItem.createdAt));

  return NextResponse.json({
    chores: chores.map(toChoreItem),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateChoreBody;
  try {
    payload = (await request.json()) as CreateChoreBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawTitle = typeof payload.title === "string" ? payload.title : "";
  const title = normalizeChoreTitle(rawTitle);

  if (!isValidChoreTitle(title)) {
    return NextResponse.json(
      { error: "Chore name must be 2-80 characters." },
      { status: 400 },
    );
  }

  const existing = await db
    .select({
      id: choreItem.id,
      title: choreItem.title,
    })
    .from(choreItem)
    .orderBy(asc(choreItem.title));

  const duplicate = existing.find(
    (chore) => chore.title.toLowerCase() === title.toLowerCase(),
  );

  if (duplicate) {
    return NextResponse.json(
      { error: "That chore already exists." },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(choreItem)
    .values({
      id: crypto.randomUUID(),
      createdByUserId: session.user.id,
      title,
    })
    .returning();

  return NextResponse.json({
    chore: toChoreItem(created),
  });
}
