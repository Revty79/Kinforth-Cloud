import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { familyShoppingItem } from "@/db/schema";
import { getSession } from "@/lib/auth-session";
import type { FamilyShoppingItem } from "@/lib/shopping-list";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateShoppingItemBody = {
  isChecked?: unknown;
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

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: UpdateShoppingItemBody;
  try {
    payload = (await request.json()) as UpdateShoppingItemBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof payload.isChecked !== "boolean") {
    return NextResponse.json(
      { error: "isChecked must be true or false." },
      { status: 400 },
    );
  }

  const params = await context.params;
  const itemId = params.id;
  const isChecked = payload.isChecked;

  const [updated] = await db
    .update(familyShoppingItem)
    .set({
      isChecked,
      checkedAt: isChecked ? new Date() : null,
      checkedByUserId: isChecked ? session.user.id : null,
    })
    .where(eq(familyShoppingItem.id, itemId))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Shopping list item not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    item: toFamilyShoppingItem(updated),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const itemId = params.id;

  const [deleted] = await db
    .delete(familyShoppingItem)
    .where(eq(familyShoppingItem.id, itemId))
    .returning({ id: familyShoppingItem.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "Shopping list item not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
