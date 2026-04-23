import {
  ShieldCheck,
  CalendarDays,
  Cloud,
  MessagesSquare,
  ShoppingBasket,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { requireSession } from "@/lib/auth-session";
import { getFamilyRoleLabel } from "@/lib/user-access-client";
import { getUserRole } from "@/lib/user-access";
export default async function DashboardPage() {
  const session = await requireSession("/login?next=/dashboard");
  const role = await getUserRole(session.user.id);
  const cards = [
    {
      title: "Calendars",
      detail:
        "Choose between family, chore, and personal calendar spaces.",
      icon: CalendarDays,
      href: "/calendars",
      cta: "Open calendars",
    },
    {
      title: "Family files",
      detail:
        "Keep shared documents, photos, and household records in one place.",
      icon: UploadCloud,
      href: "/files",
      cta: "Open files",
    },
    {
      title: "Communication center",
      detail:
        "Post updates to the family billboard and chat together in one place.",
      icon: MessagesSquare,
      href: "/communication",
      cta: "Open communication",
    },
    {
      title: "Shopping list",
      detail:
        "Track family needs and wants, then check items off as they are picked up.",
      icon: ShoppingBasket,
      href: "/shopping-list",
      cta: "Open shopping list",
    },
    {
      title: "Private cloud",
      detail:
        "Your account-only calendar, private chat, and private files live here.",
      icon: Cloud,
      href: "/private-cloud",
      cta: "Open private cloud",
    },
    ...(role === "admin"
      ? [
          {
            title: "Admin panel",
            detail:
              "Assign roles and private storage limits for each family account.",
            icon: ShieldCheck,
            href: "/admin",
            cta: "Open admin panel",
          },
        ]
      : []),
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[#d7c8b2] bg-gradient-to-r from-[#f9ecda] to-[#dce8e5] p-7 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#ccbba2] bg-[#fff4e4] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#54665d]">
          <Sparkles className="h-3.5 w-3.5 text-accent-strong" />
          Dashboard
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-[#21322c]">
          You&apos;re signed in
        </h1>
        <p className="mt-2 inline-flex rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-[#4b5a53]">
          Role: {getFamilyRoleLabel(role)}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#3f5048]">
          This is your protected area for shared family tools and account-private
          cloud spaces.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.title}
            className="fc-card rounded-xl border border-[#d6c8b2] p-5"
          >
            <card.icon className="h-6 w-6 text-sage" />
            <h2 className="mt-4 font-display text-2xl tracking-tight text-[#23362f]">
              {card.title}
            </h2>
            <p className="mt-3 text-sm leading-7 fc-text-muted">{card.detail}</p>
            {card.href ? (
              <Link
                href={card.href}
                className="mt-4 inline-flex rounded-full border border-[#cbbba4] bg-[#f7eddd] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#42534b] transition hover:border-[#b8a183] hover:text-[#2b3b34]"
              >
                {card.cta}
              </Link>
            ) : (
              <span className="mt-4 inline-flex rounded-full border border-[#d2c3ad] bg-[#f5ebdc] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f6d66]">
                {card.cta}
              </span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
