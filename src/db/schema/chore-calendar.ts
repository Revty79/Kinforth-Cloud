import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const choreItem = pgTable(
  "chore_item",
  {
    id: text("id").primaryKey(),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("chore_item_created_by_user_id_idx").on(table.createdByUserId),
    index("chore_item_title_idx").on(table.title),
  ],
);

export const choreAssignment = pgTable(
  "chore_assignment",
  {
    id: text("id").primaryKey(),
    assignedByUserId: text("assigned_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    choreTitle: text("chore_title").notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("chore_assignment_date_assigned_by_unique_idx").on(
      table.date,
      table.assignedByUserId,
    ),
    index("chore_assignment_assigned_by_user_id_idx").on(table.assignedByUserId),
    index("chore_assignment_date_idx").on(table.date),
    index("chore_assignment_completed_at_idx").on(table.completedAt),
  ],
);
