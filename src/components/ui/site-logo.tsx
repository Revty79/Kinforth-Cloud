import { CloudSun } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  href?: string;
  subtitle?: boolean;
};

export function SiteLogo({ className, href = "/", subtitle = false }: Props) {
  const content = (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#f6e2c9] text-accent-strong">
        <CloudSun className="h-5 w-5" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl tracking-tight text-foreground">
          Family Cloud
        </span>
        {subtitle ? (
          <span className="mt-1 block text-xs font-medium uppercase tracking-[0.14em] fc-text-muted">
            Private home cloud
          </span>
        ) : null}
      </span>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="focus-visible:outline-none">
      {content}
    </Link>
  );
}
