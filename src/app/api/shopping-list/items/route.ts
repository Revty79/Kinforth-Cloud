import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyShoppingItem } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import {
  isValidShoppingItemLabel,
  isValidShoppingListBucket,
  maxShoppingItemLabelLength,
  normalizeShoppingItemLabel,
  type FamilyShoppingItem,
} from "@/lib/shopping-list";

type CreateShoppingItemBody = {
  label?: unknown;
  bucket?: unknown;
};

function toFamilyShoppingItem(
  row: typeof familyShoppingItem.$inferSelect,
): FamilyShoppingItem {
  return {
    id: row.id,
    label: row.label,
    bucket: row.bucket as FamilyShoppingItem["bucket"],
    isChecked: row.isChecked,
    createdByName: row.createdByName,
    createdByUserId: row.createdByUserId,
    checkedByUserId: row.checkedByUserId,
    checkedAt: row.checkedAt ? row.checkedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateShoppingItemBody;
  try {
    payload = (await request.json()) as CreateShoppingItemBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const labelRaw = typeof payload.label === "string" ? payload.label : "";
  const bucketRaw = typeof payload.bucket === "string" ? payload.bucket : "";
  const label = normalizeShoppingItemLabel(labelRaw);

  if (!isValidShoppingListBucket(bucketRaw)) {
    return NextResponse.json(
      { error: "Bucket must be either needs or wants." },
      { status: 400 },
    );
  }

  if (!isValidShoppingItemLabel(label)) {
    return NextResponse.json(
      {
        error: `Item text must be 1-${maxShoppingItemLabelLength} characters.`,
      },
      { status: 400 },
    );
  }

  const createdByName =
    normalizeShoppingItemLabel(session.user.name ?? "") ||
    session.user.email ||
    "Family member";

  const [created] = await db
    .insert(familyShoppingItem)
    .values({
      id: crypto.randomUUID(),
      createdByUserId: session.user.id,
      createdByName,
      label,
      bucket: bucketRaw,
    })
    .returning();

  return NextResponse.json({
    item: toFamilyShoppingItem(created),
  });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db
    .delete(familyShoppingItem)
    .where(eq(familyShoppingItem.isChecked, true))
    .returning({ id: familyShoppingItem.id });

  return NextResponse.json({
    deletedCount: deleted.length,
  });
}
