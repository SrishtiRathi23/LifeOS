import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="font-accent text-2xl text-terracotta">{eyebrow}</p> : null}
        <h1 className="font-serif text-5xl italic text-ink">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/70">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
