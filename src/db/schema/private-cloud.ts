import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const privateCloudFile = pgTable(
  "private_cloud_file",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    originalName: text("original_name").notNull(),
    storedName: text("stored_name").notNull().unique(),
    fileUrl: text("file_url").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    category: text("category").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("private_cloud_file_owner_user_id_idx").on(table.ownerUserId),
    index("private_cloud_file_category_idx").on(table.category),
    index("private_cloud_file_created_at_idx").on(table.createdAt),
  ],
);

export const privateCloudChatMessage = pgTable(
  "private_cloud_chat_message",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sentByUserId: text("sent_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientUserId: text("recipient_user_id")
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
    index("private_cloud_chat_message_owner_user_id_idx").on(table.ownerUserId),
    index("private_cloud_chat_message_sent_by_user_id_idx").on(table.sentByUserId),
    index("private_cloud_chat_message_recipient_user_id_idx").on(
      table.recipientUserId,
    ),
    index("private_cloud_chat_message_created_at_idx").on(table.createdAt),
  ],
);
