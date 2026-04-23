import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthFormShell({ title, description, children }: Props) {
  return (
    <section className="fc-card w-full max-w-md p-7 sm:p-9">
      <h1 className="font-display text-3xl tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm fc-text-muted">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
