import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteLogo } from "@/components/ui/site-logo";
import { requireSession } from "@/lib/auth-session";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession("/login?next=/dashboard");

  return (
    <main className="min-h-screen">
      <header className="border-b border-[#d9ccb999] bg-[#fff8ee80] backdrop-blur-sm">
        <div className="fc-container flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <SiteLogo subtitle={false} />
            <span className="hidden rounded-full border border-[#d2c2ac] bg-[#f4e9d7] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-[#4b5a53] sm:inline-flex">
              Family Hub
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#2d3e37]">
                {session.user.name || "Family member"}
              </p>
              <p className="text-xs fc-text-muted">{session.user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="fc-container py-8">{children}</div>
      <footer className="border-t border-[#d9ccb9] py-6">
        <div className="fc-container text-xs fc-text-muted">
          <Link href="/" className="font-semibold text-[#385346] hover:text-accent">
            Family Cloud
          </Link>{" "}
          private family space.
        </div>
      </footer>
    </main>
  );
}
