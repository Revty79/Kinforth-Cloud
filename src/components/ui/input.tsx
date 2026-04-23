import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-[#fffdf8] px-3 text-sm text-foreground placeholder:text-[#6b7a71] focus:border-accent focus:outline-none focus:ring-2 focus:ring-[#b8664240]",
        className,
      )}
      {...props}
    />
  );
}
