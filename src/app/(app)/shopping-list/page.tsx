import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { ShoppingListBoard } from "@/components/dashboard/shopping-list-board";
import { db } from "@/db";
import { familyShoppingItem } from "@/db/schema";
import { requireSession } from "@/lib/auth-session";
import type { FamilyShoppingItem } from "@/lib/shopping-list";

export default async function ShoppingListPage() {
  await requireSession("/login?next=/shopping-list");

  const rows = await db
    .select({
      id: familyShoppingItem.id,
      label: familyShoppingItem.label,
      bucket: familyShoppingItem.bucket,
      isChecked: familyShoppingItem.isChecked,
      createdByName: familyShoppingItem.createdByName,
      createdByUserId: familyShoppingItem.createdByUserId,
      checkedByUserId: familyShoppingItem.checkedByUserId,
      checkedAt: familyShoppingItem.checkedAt,
      createdAt: familyShoppingItem.createdAt,
      updatedAt: familyShoppingItem.updatedAt,
    })
    .from(familyShoppingItem)
    .orderBy(
      asc(familyShoppingItem.bucket),
      asc(familyShoppingItem.isChecked),
      desc(familyShoppingItem.createdAt),
    );

  const initialItems: FamilyShoppingItem[] = rows.map((item) => ({
    id: item.id,
    label: item.label,
    bucket: item.bucket as FamilyShoppingItem["bucket"],
    isChecked: item.isChecked,
    createdByName: item.createdByName,
    createdByUserId: item.createdByUserId,
    checkedByUserId: item.checkedByUserId,
    checkedAt: item.checkedAt ? item.checkedAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#4e5f56]">
        <Link
          href="/dashboard"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span>Shopping list</span>
      </div>

      <ShoppingListBoard initialItems={initialItems} />
    </section>
  );
}
