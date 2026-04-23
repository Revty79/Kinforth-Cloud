import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { calendarEvent } from "@/db/schema";
import {
  type CalendarCustomEvent,
  type CalendarEventScope,
  isCalendarDateKey,
  isCalendarEventScope,
  isCalendarTimeValue,
  isCustomCalendarEventType,
} from "@/lib/calendar";
import { getSession } from "@/lib/auth-session";

type CreateCalendarEventBody = {
  title?: unknown;
  date?: unknown;
  type?: unknown;
  time?: unknown;
  scope?: unknown;
};

function toCalendarCustomEvent(
  row: typeof calendarEvent.$inferSelect,
): CalendarCustomEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    type: row.type as CalendarCustomEvent["type"],
    time: row.time ?? undefined,
  };
}

function parseScope(value: unknown): CalendarEventScope | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!isCalendarEventScope(normalized)) {
    return null;
  }

  return normalized;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const rawScope = requestUrl.searchParams.get("scope");
  const parsedScope = parseScope(rawScope);

  if (rawScope !== null && !parsedScope) {
    return NextResponse.json(
      { error: "Scope must be either family or personal." },
      { status: 400 },
    );
  }

  const scope: CalendarEventScope = parsedScope ?? "family";

  const whereClause =
    scope === "personal"
      ? and(
          eq(calendarEvent.scope, "personal"),
          eq(calendarEvent.userId, session.user.id),
        )
      : eq(calendarEvent.scope, "family");

  const rows = await db
    .select()
    .from(calendarEvent)
    .where(whereClause)
    .orderBy(
      asc(calendarEvent.date),
      asc(calendarEvent.time),
      asc(calendarEvent.createdAt),
    );

  return NextResponse.json({
    events: rows.map(toCalendarCustomEvent),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CreateCalendarEventBody;
  try {
    payload = (await request.json()) as CreateCalendarEventBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const date = typeof payload.date === "string" ? payload.date.trim() : "";
  const rawType = typeof payload.type === "string" ? payload.type.trim() : "";
  const rawTime = typeof payload.time === "string" ? payload.time.trim() : "";
  const rawScope = parseScope(payload.scope);
  const scope: CalendarEventScope = rawScope ?? "family";
  const time = rawTime.length > 0 ? rawTime : undefined;

  if (!title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 },
    );
  }

  if (!isCalendarDateKey(date)) {
    return NextResponse.json(
      { error: "Date must be in YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  if (!isCustomCalendarEventType(rawType)) {
    return NextResponse.json(
      { error: "Event type is invalid." },
      { status: 400 },
    );
  }

  if (time && !isCalendarTimeValue(time)) {
    return NextResponse.json(
      { error: "Time must be in HH:mm format." },
      { status: 400 },
    );
  }

  if (typeof payload.scope !== "undefined" && rawScope === null) {
    return NextResponse.json(
      { error: "Scope must be either family or personal." },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(calendarEvent)
    .values({
      id: crypto.randomUUID(),
      scope,
      userId: session.user.id,
      title,
      date,
      time,
      type: rawType,
    })
    .returning();

  return NextResponse.json({
    event: toCalendarCustomEvent(created),
  });
}
