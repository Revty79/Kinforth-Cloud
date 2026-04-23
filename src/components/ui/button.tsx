import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseStyles =
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-60";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-md shadow-[#b8664230] hover:bg-accent-strong",
  secondary:
    "border border-line bg-surface text-foreground hover:bg-surface-deep hover:border-[#c9b79a]",
  ghost: "text-foreground hover:bg-[#ffffff70]",
};

export function buttonStyles(variant: ButtonVariant = "primary") {
  return cn(baseStyles, variantStyles[variant]);
}

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(buttonStyles(variant), className)}
      {...props}
    />
  );
}
