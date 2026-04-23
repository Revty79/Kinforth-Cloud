import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { SiteLogo } from "@/components/ui/site-logo";
import { cn } from "@/lib/cn";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[#d8cab699] bg-[#fff7eb80] backdrop-blur-sm">
        <div className="fc-container flex h-20 items-center justify-between">
          <SiteLogo subtitle />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={cn(
                buttonStyles("ghost"),
                "h-10 px-3 text-sm hidden sm:inline-flex",
              )}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonStyles("primary"), "h-10 px-4 text-sm")}
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
