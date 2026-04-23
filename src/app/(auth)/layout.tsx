import { House } from "lucide-react";
import Link from "next/link";
import { SiteLogo } from "@/components/ui/site-logo";
import { requireGuest } from "@/lib/auth-session";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireGuest("/dashboard");

  return (
    <main className="flex min-h-[calc(100vh-5rem)]">
      <section className="hidden w-[45%] border-r border-[#d4c6b480] bg-gradient-to-br from-[#f7e8d16e] via-[#f2e5d85a] to-[#dfe8e56e] backdrop-blur-[1px] lg:block">
        <div className="flex h-full flex-col justify-between p-10">
          <SiteLogo href="/" subtitle />
          <div className="max-w-sm">
            <p className="font-display text-4xl leading-tight text-[#22342d]">
              Sign in to Family Cloud
            </p>
            <p className="mt-4 text-sm leading-7 text-[#40524a]">
              Keep your family&apos;s account private and easy to access.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#2c4338] hover:text-accent-strong"
          >
            <House className="h-4 w-4" />
            Back to landing page
          </Link>
        </div>
      </section>
      <section className="fc-container flex flex-1 items-center justify-center py-14">
        {children}
      </section>
    </main>
  );
}
