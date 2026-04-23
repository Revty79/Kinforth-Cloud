import { bigint, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const familyUserAccessProfile = pgTable(
  "family_user_access_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("family_member"),
    privateStorageLimitBytes: bigint("private_storage_limit_bytes", {
      mode: "number",
    })
      .notNull()
      .default(5 * 1024 * 1024 * 1024),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("family_user_access_profile_role_idx").on(table.role)],
);
