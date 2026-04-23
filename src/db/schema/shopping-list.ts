import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const familyShoppingItem = pgTable(
  "family_shopping_item",
  {
    id: text("id").primaryKey(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdByName: text("created_by_name").notNull(),
    label: text("label").notNull(),
    bucket: text("bucket").notNull(),
    isChecked: boolean("is_checked").default(false).notNull(),
    checkedByUserId: text("checked_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    checkedAt: timestamp("checked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("family_shopping_item_created_by_user_id_idx").on(table.createdByUserId),
    index("family_shopping_item_checked_by_user_id_idx").on(table.checkedByUserId),
    index("family_shopping_item_bucket_idx").on(table.bucket),
    index("family_shopping_item_is_checked_idx").on(table.isChecked),
    index("family_shopping_item_created_at_idx").on(table.createdAt),
  ],
);
