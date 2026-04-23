"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  type CalendarCustomEvent,
  type CalendarEventScope,
  type CustomCalendarEventType,
  customCalendarEventTypes,
  isCalendarDateKey,
  isCalendarTimeValue,
  isCustomCalendarEventType,
} from "@/lib/calendar";

type EventType = "Holiday" | CustomCalendarEventType;
type EventSource = "holiday" | "custom";

type FamilyEvent = {
  id: string;
  date: string;
  title: string;
  type: EventType;
  source: EventSource;
  time?: string;
};

type FamilyCalendarProps = {
  initialCustomEvents: CalendarCustomEvent[];
  scope?: CalendarEventScope;
};

type CalendarCopy = {
  pillLabel: string;
  heading: string;
  description: string;
  addHeading: string;
  upcomingHeading: string;
  emptyUpcomingMessage: string;
  titlePlaceholder: string;
};

const calendarCopyByScope: Record<CalendarEventScope, CalendarCopy> = {
  family: {
    pillLabel: "Plans and schedules",
    heading: "Family calendar",
    description:
      "Add and remove shared family events anytime. U.S. federal holidays are preloaded.",
    addHeading: "Add event",
    upcomingHeading: "Upcoming",
    emptyUpcomingMessage: "No upcoming events yet.",
    titlePlaceholder: "Soccer practice",
  },
  personal: {
    pillLabel: "Private planning",
    heading: "Personal calendar",
    description:
      "Private events and reminders that only your account can see. U.S. federal holidays are preloaded.",
    addHeading: "Add private event",
    upcomingHeading: "My upcoming",
    emptyUpcomingMessage: "No upcoming personal events yet.",
    titlePlaceholder: "Therapy appointment",
  },
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const eventBadgeStyles: Record<EventType, string> = {
  Holiday: "bg-[#e7edf8] text-[#274074]",
  Family: "bg-[#efe7f7] text-[#4e3d73]",
  School: "bg-[#e6effd] text-[#2f4a82]",
  Home: "bg-[#f6ead9] text-[#7a4f2f]",
  Health: "bg-[#e4f3ee] text-[#245b4c]",
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const [yearString, monthString, dayString] = dateKey.split("-");
  return new Date(
    Number(yearString),
    Number(monthString) - 1,
    Number(dayString),
  );
}

function formatEventTime(time?: string) {
  if (!time) {
    return "";
  }

  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function buildEventDateTime(event: FamilyEvent) {
  const date = parseDateKey(event.date);

  if (!event.time) {
    return date;
  }

  const [hourString, minuteString] = event.time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return date;
  }

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
  );
}

function buildCalendarCells(year: number, month: number): Array<number | null> {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<number | null> = Array.from(
    { length: firstWeekday },
    () => null,
  );

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
) {
  const firstOfMonth = new Date(year, month, 1);
  const offset = (7 + weekday - firstOfMonth.getDay()) % 7;
  const day = 1 + offset + (occurrence - 1) * 7;
  return new Date(year, month, day);
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number) {
  const lastOfMonth = new Date(year, month + 1, 0);
  const offset = (7 + lastOfMonth.getDay() - weekday) % 7;
  return new Date(year, month, lastOfMonth.getDate() - offset);
}

function getUsFederalHolidays(year: number): FamilyEvent[] {
  const holidays = [
    { title: "New Year's Day", date: new Date(year, 0, 1) },
    {
      title: "Martin Luther King Jr. Day",
      date: nthWeekdayOfMonth(year, 0, 1, 3),
    },
    { title: "Presidents' Day", date: nthWeekdayOfMonth(year, 1, 1, 3) },
    { title: "Memorial Day", date: lastWeekdayOfMonth(year, 4, 1) },
    { title: "Juneteenth", date: new Date(year, 5, 19) },
    { title: "Independence Day", date: new Date(year, 6, 4) },
    { title: "Labor Day", date: nthWeekdayOfMonth(year, 8, 1, 1) },
    { title: "Columbus Day", date: nthWeekdayOfMonth(year, 9, 1, 2) },
    { title: "Veterans Day", date: new Date(year, 10, 11) },
    { title: "Thanksgiving Day", date: nthWeekdayOfMonth(year, 10, 4, 4) },
    { title: "Christmas Day", date: new Date(year, 11, 25) },
  ];

  return holidays
    .map((holiday) => ({
      id: `holiday-${formatDateKey(holiday.date)}-${holiday.title}`,
      date: formatDateKey(holiday.date),
      title: holiday.title,
      type: "Holiday" as const,
      source: "holiday" as const,
    }))
    .sort(
      (a, b) => buildEventDateTime(a).getTime() - buildEventDateTime(b).getTime(),
    );
}

function sortEvents(events: FamilyEvent[]) {
  return [...events].sort(
    (a, b) => buildEventDateTime(a).getTime() - buildEventDateTime(b).getTime(),
  );
}

function normalizeCustomEvents(events: CalendarCustomEvent[]): FamilyEvent[] {
  return sortEvents(
    events
      .filter((event) => {
        if (
          typeof event.id !== "string" ||
          typeof event.title !== "string" ||
          typeof event.date !== "string" ||
          !isCalendarDateKey(event.date) ||
          !isCustomCalendarEventType(event.type)
        ) {
          return false;
        }

        if (event.time && !isCalendarTimeValue(event.time)) {
          return false;
        }

        return true;
      })
      .map((event) => ({
        ...event,
        source: "custom" as const,
      })),
  );
}

function parseApiError(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return "Something went wrong. Please try again.";
}

async function parseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export function FamilyCalendar({
  initialCustomEvents,
  scope = "family",
}: FamilyCalendarProps) {
  const copy = calendarCopyByScope[scope];
  const defaultEventType: CustomCalendarEventType =
    scope === "personal" ? "Home" : "Family";

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [customEvents, setCustomEvents] = useState<FamilyEvent[]>(
    normalizeCustomEvents(initialCustomEvents),
  );
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(formatDateKey(today));
  const [formTime, setFormTime] = useState("");
  const [formType, setFormType] = useState<CustomCalendarEventType>(
    defaultEventType,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleMonthYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();

  const holidayEvents = useMemo(() => {
    const years = new Set<number>([
      today.getFullYear() - 1,
      today.getFullYear(),
      today.getFullYear() + 1,
      visibleMonthYear,
      visibleMonthYear + 1,
    ]);

    return Array.from(years)
      .flatMap((year) => getUsFederalHolidays(year))
      .sort(
        (a, b) => buildEventDateTime(a).getTime() - buildEventDateTime(b).getTime(),
      );
  }, [today, visibleMonthYear]);

  const allEvents = useMemo(
    () => sortEvents([...holidayEvents, ...customEvents]),
    [holidayEvents, customEvents],
  );

  const monthEvents = useMemo(
    () =>
      allEvents.filter((event) => {
        const eventDate = parseDateKey(event.date);
        return (
          eventDate.getFullYear() === visibleMonthYear &&
          eventDate.getMonth() === visibleMonthIndex
        );
      }),
    [allEvents, visibleMonthIndex, visibleMonthYear],
  );

  const eventsByDay = useMemo(() => {
    const grouped = new Map<number, FamilyEvent[]>();

    for (const event of monthEvents) {
      const day = parseDateKey(event.date).getDate();
      const dayEvents = grouped.get(day) ?? [];
      dayEvents.push(event);
      grouped.set(day, dayEvents);
    }

    for (const [day, dayEvents] of grouped.entries()) {
      grouped.set(day, sortEvents(dayEvents));
    }

    return grouped;
  }, [monthEvents]);

  const upcomingEvents = useMemo(
    () =>
      allEvents
        .filter((event) => buildEventDateTime(event).getTime() >= today.getTime())
        .slice(0, 8),
    [allEvents, today],
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(visibleMonth),
    [visibleMonth],
  );

  const fullDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(visibleMonthYear, visibleMonthIndex),
    [visibleMonthIndex, visibleMonthYear],
  );

  const handleShiftMonth = (offset: number) => {
    setVisibleMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + offset, 1),
    );
  };

  const handleAddEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = formTitle.trim();
    const date = formDate.trim();
    const time = formTime.trim();

    if (!title) {
      setFormError("Please add an event title.");
      return;
    }

    if (!isCalendarDateKey(date)) {
      setFormError("Please choose a valid date.");
      return;
    }

    if (time && !isCalendarTimeValue(time)) {
      setFormError("Please choose a valid time.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/calendar-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          date,
          type: formType,
          time: time || undefined,
          scope,
        }),
      });

      const payload = await parseJson(response);
      if (!response.ok) {
        setFormError(parseApiError(payload));
        return;
      }

      const savedEvent =
        payload &&
        typeof payload === "object" &&
        "event" in payload &&
        payload.event &&
        typeof payload.event === "object"
          ? (payload.event as CalendarCustomEvent)
          : null;

      if (!savedEvent || !isCustomCalendarEventType(savedEvent.type)) {
        setFormError("Event was saved, but response was invalid.");
        return;
      }

      const newEvent: FamilyEvent = {
        id: savedEvent.id,
        title: savedEvent.title,
        date: savedEvent.date,
        type: savedEvent.type,
        source: "custom",
        time: savedEvent.time,
      };

      setCustomEvents((previous) => sortEvents([...previous, newEvent]));

      const eventDate = parseDateKey(savedEvent.date);
      setVisibleMonth(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
      setFormTitle("");
      setFormTime("");
    } catch {
      setFormError("Could not save this event right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEvent = async (eventId: string) => {
    setFormError(null);
    setPendingDeleteId(eventId);

    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        setFormError(parseApiError(payload));
        return;
      }

      setCustomEvents((previous) =>
        previous.filter((event) => event.id !== eventId),
      );
    } catch {
      setFormError("Could not remove this event right now.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const isVisibleMonthCurrent =
    visibleMonthYear === today.getFullYear() &&
    visibleMonthIndex === today.getMonth();

  return (
    <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="fc-pill">
            <CalendarDays className="h-4 w-4 text-sage" />
            {copy.pillLabel}
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight text-[#23362f]">
            {copy.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 fc-text-muted">
            {copy.description}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#d2c1a8] bg-[#f9efdf] px-2 py-1.5">
          <button
            type="button"
            onClick={() => handleShiftMonth(-1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#cdbca5] bg-[#fff8ef] text-[#4d5d55] transition hover:border-[#bda98d] hover:text-[#2f4138]"
            aria-label="View previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="min-w-32 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#4b5b54]">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => handleShiftMonth(1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#cdbca5] bg-[#fff8ef] text-[#4d5d55] transition hover:border-[#bda98d] hover:text-[#2f4138]"
            aria-label="View next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-xl border border-[#d8c9b3] bg-[#fffdf8]">
          <div className="grid grid-cols-7 border-b border-[#d9cab2] bg-[#f4e8d7]">
            {weekdays.map((day) => (
              <p
                key={day}
                className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[#5a6d63]"
              >
                {day}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-[#d9cab2]">
            {calendarCells.map((day, index) => {
              const dayEvents = day ? eventsByDay.get(day) ?? [] : [];
              const isToday = Boolean(isVisibleMonthCurrent && day === today.getDate());

              return (
                <div
                  key={`${day ?? "empty"}-${index}`}
                  className={cn(
                    "min-h-28 bg-[#fffaf2] p-2",
                    !day && "bg-[#f8f1e6]",
                  )}
                >
                  {day ? (
                    <>
                      <p
                        className={cn(
                          "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold",
                          isToday
                            ? "bg-[#8f4325] text-white"
                            : "text-[#46574f]",
                        )}
                      >
                        {day}
                      </p>
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 2).map((dayEvent) => (
                          <p
                            key={dayEvent.id}
                            className={cn(
                              "truncate rounded-md px-1.5 py-1 text-[10px] font-semibold",
                              dayEvent.source === "holiday"
                                ? "bg-[#e6ecfa] text-[#2f4a82]"
                                : "bg-[#e6f2ec] text-[#2c4f42]",
                            )}
                            title={dayEvent.title}
                          >
                            {dayEvent.title}
                          </p>
                        ))}
                        {dayEvents.length > 2 ? (
                          <p className="text-[10px] font-semibold text-[#5d6d65]">
                            +{dayEvents.length - 2} more
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-[#d4c4ae] bg-[#fff8ef] p-3">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4e5f56]">
              <Plus className="h-4 w-4 text-accent" />
              {copy.addHeading}
            </p>
            <form className="mt-3 space-y-2" onSubmit={handleAddEvent}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Title
                </span>
                <input
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  placeholder={copy.titlePlaceholder}
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Date
                  </span>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(event) => setFormDate(event.target.value)}
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                    Time
                  </span>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(event) => setFormTime(event.target.value)}
                    className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607169]">
                  Type
                </span>
                <select
                  value={formType}
                  onChange={(event) =>
                    setFormType(event.target.value as CustomCalendarEventType)
                  }
                  className="mt-1 w-full rounded-md border border-[#cbbba4] bg-[#fffdf8] px-2.5 py-2 text-sm text-[#2f4038] outline-none transition focus:border-[#9e8569] focus:ring-2 focus:ring-[#d9c3a6]"
                >
                  {customCalendarEventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#a08062] bg-[#b86642] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#9d5737] disabled:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save event"}
              </button>
            </form>
            {formError ? (
              <p className="mt-2 text-xs font-semibold text-[#8f4325]">{formError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#4e5f56]">
              <Clock3 className="h-4 w-4 text-accent" />
              {copy.upcomingHeading}
            </p>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-lg border border-[#d4c4ae] bg-[#fff8ef] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
                          eventBadgeStyles[event.type],
                        )}
                      >
                        {event.type}
                      </p>
                      {event.source === "custom" ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveEvent(event.id)}
                          disabled={pendingDeleteId === event.id}
                          className="inline-flex items-center gap-1 rounded-md border border-[#d2b7a1] bg-[#fff3e8] px-2 py-1 text-[11px] font-semibold text-[#7a4730] transition hover:border-[#bf967a] hover:text-[#5f3422] disabled:opacity-70"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {pendingDeleteId === event.id ? "Removing..." : "Remove"}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#2f3f38]">
                      {event.title}
                    </p>
                    <p className="mt-1 text-xs fc-text-muted">
                      {fullDateFormatter.format(parseDateKey(event.date))}
                      {event.time ? ` at ${formatEventTime(event.time)}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-[#d4c4ae] bg-[#fff8ef] px-3 py-2 text-sm fc-text-muted">
                {copy.emptyUpcomingMessage}
              </p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

type PersonalCalendarProps = {
  initialCustomEvents: CalendarCustomEvent[];
};

export function PersonalCalendar({ initialCustomEvents }: PersonalCalendarProps) {
  return <FamilyCalendar initialCustomEvents={initialCustomEvents} scope="personal" />;
}
