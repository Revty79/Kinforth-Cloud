import { CalendarDays, MessageCircle, UploadCloud } from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth-session";

const privateCloudAreas = [
  {
    title: "Private calendar",
    detail: "Account-only events, reminders, and personal planning.",
    href: "/private-cloud/calendar",
    cta: "Open calendar",
    icon: CalendarDays,
  },
  {
    title: "Private chat",
    detail: "Direct private messages between family accounts.",
    href: "/private-cloud/chat",
    cta: "Open chat",
    icon: MessageCircle,
  },
  {
    title: "Private files",
    detail: "Upload and manage account-private files with your assigned storage quota.",
    href: "/private-cloud/files",
    cta: "Open files",
    icon: UploadCloud,
  },
] as const;

export default async function PrivateCloudPage() {
  await requireSession("/login?next=/private-cloud");

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#4e5f56]">
        <Link
          href="/dashboard"
          className="rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 transition hover:border-[#bfab8f] hover:text-[#31433a]"
        >
          Dashboard
        </Link>
        <span>/</span>
        <span>Private cloud</span>
      </div>

      <div className="rounded-2xl border border-[#d7c8b2] bg-gradient-to-r from-[#f9ecda] to-[#dce8e5] p-6 sm:p-7">
        <h1 className="font-display text-4xl tracking-tight text-[#21322c]">
          Private cloud dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#3f5048]">
          Choose where you want to go. Everything in this space is private to
          your signed-in account, including your private files area.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {privateCloudAreas.map((area) => (
          <article
            key={area.title}
            className="fc-card rounded-xl border border-[#d6c8b2] p-5"
          >
            <area.icon className="h-6 w-6 text-sage" />
            <h2 className="mt-4 font-display text-2xl tracking-tight text-[#23362f]">
              {area.title}
            </h2>
            <p className="mt-3 text-sm leading-7 fc-text-muted">{area.detail}</p>
            <Link
              href={area.href}
              className="mt-4 inline-flex rounded-full border border-[#cbbba4] bg-[#f7eddd] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#42534b] transition hover:border-[#b8a183] hover:text-[#2b3b34]"
            >
              {area.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
