import Link from "next/link";
import { CalendarsHub } from "@/components/dashboard/calendars-hub";

export default function CalendarsPage() {
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
        <span>Calendars</span>
      </div>

      <CalendarsHub />
    </section>
  );
}
