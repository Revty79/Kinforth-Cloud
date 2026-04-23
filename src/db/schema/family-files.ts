import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const familyFile = pgTable(
  "family_file",
  {
    id: text("id").primaryKey(),
    uploadedByUserId: text("uploaded_by_user_id")
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
    index("family_file_uploaded_by_user_id_idx").on(table.uploadedByUserId),
    index("family_file_category_idx").on(table.category),
    index("family_file_created_at_idx").on(table.createdAt),
  ],
);

export const familyContact = pgTable(
  "family_contact",
  {
    id: text("id").primaryKey(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    relation: text("relation"),
    phone: text("phone").notNull(),
    secondaryPhone: text("secondary_phone"),
    email: text("email"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("family_contact_created_by_user_id_idx").on(table.createdByUserId),
    index("family_contact_full_name_idx").on(table.fullName),
  ],
);
