import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const calendarEvent = pgTable(
  "calendar_event",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull().default("family"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    date: text("date").notNull(),
    time: text("time"),
    type: text("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("calendar_event_scope_idx").on(table.scope),
    index("calendar_event_scope_date_idx").on(table.scope, table.date),
    index("calendar_event_scope_user_date_idx").on(
      table.scope,
      table.userId,
      table.date,
    ),
    index("calendar_event_user_id_idx").on(table.userId),
    index("calendar_event_user_date_idx").on(table.userId, table.date),
  ],
);
