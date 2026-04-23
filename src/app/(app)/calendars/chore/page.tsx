import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ChoreCalendar } from "@/components/dashboard/chore-calendar";
import { db } from "@/db";
import { choreAssignment, choreItem, user } from "@/db/schema";
import { cleanupExpiredCompletedChoreAssignments } from "@/lib/chore-calendar-server";
import { requireSession } from "@/lib/auth-session";
import type { ChoreAssignment, ChoreItem } from "@/lib/chore-calendar";

export default async function ChoreCalendarPage() {
  const session = await requireSession("/login?next=/calendars/chore");

  await cleanupExpiredCompletedChoreAssignments();

  const [choreRows, assignmentRows] = await Promise.all([
    db
      .select({
        id: choreItem.id,
        title: choreItem.title,
        createdAt: choreItem.createdAt,
      })
      .from(choreItem)
      .orderBy(asc(choreItem.title), asc(choreItem.createdAt)),
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

  const initialChores: ChoreItem[] = choreRows.map((chore) => ({
    id: chore.id,
    title: chore.title,
    createdAt: chore.createdAt.toISOString(),
  }));

  const initialAssignments: ChoreAssignment[] = assignmentRows.map(
    (assignment) => ({
      id: assignment.id,
      date: assignment.date,
      choreTitle: assignment.choreTitle,
      assignedUserId: assignment.assignedByUserId,
      assignedUserName: assignment.assignedUserName,
      completedAt: assignment.completedAt ? assignment.completedAt.toISOString() : null,
      createdAt: assignment.createdAt.toISOString(),
    }),
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#4e5f56]">
        <Link
          href="/dashboard"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href="/calendars"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Calendars
        </Link>
        <span>/</span>
        <span>Chore</span>
      </div>

      <ChoreCalendar
        currentUserId={session.user.id}
        initialChores={initialChores}
        initialAssignments={initialAssignments}
      />
    </section>
  );
}
