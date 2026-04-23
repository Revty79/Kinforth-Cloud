import { CalendarDays, Clock3, UserRound } from "lucide-react";
import Link from "next/link";

const calendarSpaces = [
  {
    title: "Family calendar",
    detail:
      "Shared appointments, events, and routines everyone in the household can see.",
    href: "/calendar",
    cta: "Open family calendar",
    icon: CalendarDays,
  },
  {
    title: "Chore calendar",
    detail:
      "A dedicated place for recurring chores, assignment days, and task planning.",
    href: "/calendars/chore",
    cta: "Open chore calendar",
    icon: Clock3,
  },
  {
    title: "Private calendar",
    detail:
      "Your personal schedule now lives in the Private Cloud dashboard.",
    href: "/private-cloud/calendar",
    cta: "Open private calendar",
    icon: UserRound,
  },
] as const;

export function CalendarsHub() {
  return (
    <article className="fc-card rounded-xl border border-[#d6c8b2] p-5 sm:p-6">
      <div>
        <p className="fc-pill">
          <CalendarDays className="h-4 w-4 text-sage" />
          Calendar spaces
        </p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-[#23362f]">
          Calendars
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 fc-text-muted">
          Choose the calendar space you want to manage right now.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {calendarSpaces.map((space) => (
          <article
            key={space.title}
            className="rounded-lg border border-[#d7c9b4] bg-[#fff8ee] p-4"
          >
            <space.icon className="h-5 w-5 text-sage" />
            <h3 className="mt-3 font-display text-2xl tracking-tight text-[#243730]">
              {space.title}
            </h3>
            <p className="mt-2 text-sm leading-7 fc-text-muted">{space.detail}</p>
            <Link
              href={space.href}
              className="mt-4 inline-flex rounded-full border border-[#cbbba4] bg-[#f7eddd] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#42534b] transition hover:border-[#b8a183] hover:text-[#2b3b34]"
            >
              {space.cta}
            </Link>
          </article>
        ))}
      </div>
    </article>
  );
}
