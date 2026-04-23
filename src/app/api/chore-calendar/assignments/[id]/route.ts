import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { choreAssignment, user } from "@/db/schema";
import type { ChoreAssignment } from "@/lib/chore-calendar";
import { cleanupExpiredCompletedChoreAssignments } from "@/lib/chore-calendar-server";
import { getSession } from "@/lib/auth-session";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateAssignmentBody = {
  completed?: unknown;
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

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cleanupExpiredCompletedChoreAssignments();

  let payload: UpdateAssignmentBody;
  try {
    payload = (await request.json()) as UpdateAssignmentBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof payload.completed !== "boolean") {
    return NextResponse.json(
      { error: "completed must be a boolean." },
      { status: 400 },
    );
  }

  const params = await context.params;
  const assignmentId = params.id;
  const now = new Date();

  const [updated] = await db
    .update(choreAssignment)
    .set({
      completedAt: payload.completed ? now : null,
      updatedAt: now,
    })
    .where(eq(choreAssignment.id, assignmentId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  const [assignee] = await db
    .select({
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, updated.assignedByUserId))
    .limit(1);

  return NextResponse.json({
    assignment: toChoreAssignment(updated, assignee?.name ?? "Family member"),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cleanupExpiredCompletedChoreAssignments();

  const params = await context.params;
  const assignmentId = params.id;

  const [deleted] = await db
    .delete(choreAssignment)
    .where(eq(choreAssignment.id, assignmentId))
    .returning({ id: choreAssignment.id });

  if (!deleted) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
