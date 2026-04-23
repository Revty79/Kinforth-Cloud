import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { choreAssignment, choreItem, user } from "@/db/schema";
import type { ChoreItem } from "@/lib/chore-calendar";
import {
  cleanupExpiredCompletedChoreAssignments,
  toChoreAssignment,
} from "@/lib/chore-calendar-server";
import { getSession } from "@/lib/auth-session";

function toChoreItem(row: typeof choreItem.$inferSelect): ChoreItem {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cleanupExpiredCompletedChoreAssignments();

  const [chores, assignments] = await Promise.all([
    db.select().from(choreItem).orderBy(asc(choreItem.title), asc(choreItem.createdAt)),
    db
      .select({
        id: choreAssignment.id,
        date: choreAssignment.date,
        choreTitle: choreAssignment.choreTitle,
        assignedByUserId: choreAssignment.assignedByUserId,
        assignedUserName: user.name,
        completedAt: choreAssignment.completedAt,
        createdAt: choreAssignment.createdAt,
      })
      .from(choreAssignment)
      .innerJoin(user, eq(choreAssignment.assignedByUserId, user.id))
      .orderBy(asc(choreAssignment.date), asc(choreAssignment.createdAt)),
  ]);

  return NextResponse.json({
    chores: chores.map(toChoreItem),
    assignments: assignments.map(toChoreAssignment),
  });
}
