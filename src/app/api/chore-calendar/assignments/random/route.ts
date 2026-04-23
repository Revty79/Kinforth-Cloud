import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { choreAssignment, choreItem } from "@/db/schema";
import { isCalendarDateKey } from "@/lib/calendar";
import type { ChoreAssignment } from "@/lib/chore-calendar";
import { cleanupExpiredCompletedChoreAssignments } from "@/lib/chore-calendar-server";
import { getSession } from "@/lib/auth-session";

type AssignRandomBody = {
  date?: unknown;
};

function toChoreAssignment(
  row: typeof choreAssignment.$inferSelect,
  assignedUserName: string,
): ChoreAssignment {
  return {
    id: row.id,
    date: row.date,
    choreTitle: row.choreTitle,
    assignedUserId: row.assignedByUserId,
    assignedUserName,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function pickRandomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cleanupExpiredCompletedChoreAssignments();

  let payload: AssignRandomBody;
  try {
    payload = (await request.json()) as AssignRandomBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const date = typeof payload.date === "string" ? payload.date.trim() : "";
  if (!isCalendarDateKey(date)) {
    return NextResponse.json(
      { error: "Date must be in YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  const chores = await db
    .select({
      title: choreItem.title,
    })
    .from(choreItem)
    .orderBy(asc(choreItem.title), asc(choreItem.createdAt));

  if (chores.length === 0) {
    return NextResponse.json(
      { error: "Add at least one chore before assigning randomly." },
      { status: 400 },
    );
  }

  const randomChore = chores[pickRandomIndex(chores.length)];
  const now = new Date();
  const assignmentId = crypto.randomUUID();

  const [saved] = await db
    .insert(choreAssignment)
    .values({
      id: assignmentId,
      assignedByUserId: session.user.id,
      date,
      choreTitle: randomChore.title,
      completedAt: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [choreAssignment.date, choreAssignment.assignedByUserId],
      set: {
        choreTitle: randomChore.title,
        assignedByUserId: session.user.id,
        completedAt: null,
        updatedAt: now,
      },
    })
    .returning();

  const assignedUserName = session.user.name || "Family member";

  return NextResponse.json({
    assignment: toChoreAssignment(saved, assignedUserName),
  });
}
