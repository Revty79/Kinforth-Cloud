import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const items = [
  {
    icon: ShieldCheck,
    title: "Secure accounts",
    text: "Email + password authentication with persistent sessions.",
  },
  {
    icon: KeyRound,
    title: "Password reset",
    text: "Forgot/reset flow is ready for real use.",
  },
  {
    icon: Lock,
    title: "Protected app area",
    text: "Dashboard routes are private and require login.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <section className="fc-container py-16 md:py-24">
        <div className="fc-card mx-auto max-w-3xl p-8 text-center sm:p-10">
          <h1 className="font-display text-4xl tracking-tight text-[#1f2f29] sm:text-5xl">
            Family Cloud
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 fc-text-muted sm:text-lg">
            Private home cloud for your family.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className={cn(buttonStyles("primary"), "px-6")}>
              Sign up
            </Link>
            <Link href="/login" className={cn(buttonStyles("secondary"), "px-6")}>
              Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="fc-container pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="fc-card p-6">
              <item.icon className="h-5 w-5 text-sage" />
              <h2 className="mt-3 font-display text-2xl tracking-tight text-[#24352e]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-7 fc-text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
