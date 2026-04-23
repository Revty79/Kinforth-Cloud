import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { FamilyCalendar } from "@/components/dashboard/family-calendar";
import { db } from "@/db";
import { calendarEvent } from "@/db/schema";
import type { CalendarCustomEvent } from "@/lib/calendar";
import { requireSession } from "@/lib/auth-session";

export default async function CalendarPage() {
  await requireSession("/login?next=/calendar");

  const customEventRows = await db
    .select({
      id: calendarEvent.id,
      title: calendarEvent.title,
      date: calendarEvent.date,
      type: calendarEvent.type,
      time: calendarEvent.time,
    })
    .from(calendarEvent)
    .where(eq(calendarEvent.scope, "family"))
    .orderBy(
      asc(calendarEvent.date),
      asc(calendarEvent.time),
      asc(calendarEvent.createdAt),
    );

  const initialCustomEvents: CalendarCustomEvent[] = customEventRows.map(
    (event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      type: event.type as CalendarCustomEvent["type"],
      time: event.time ?? undefined,
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
        <span>Family</span>
      </div>

      <FamilyCalendar initialCustomEvents={initialCustomEvents} />
    </section>
  );
}
