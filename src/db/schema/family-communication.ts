import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const familyBillboardPost = pgTable(
  "family_billboard_post",
  {
    id: text("id").primaryKey(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdByName: text("created_by_name").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("family_billboard_post_created_by_user_id_idx").on(
      table.createdByUserId,
    ),
    index("family_billboard_post_created_at_idx").on(table.createdAt),
  ],
);

export const familyChatMessage = pgTable(
  "family_chat_message",
  {
    id: text("id").primaryKey(),
    sentByUserId: text("sent_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sentByName: text("sent_by_name").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("family_chat_message_sent_by_user_id_idx").on(table.sentByUserId),
    index("family_chat_message_created_at_idx").on(table.createdAt),
  ],
);
