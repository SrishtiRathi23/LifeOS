import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx("rounded-[1.75rem] border border-line bg-card/95 p-5 shadow-glow", className)} {...props}>
      {children}
    </div>
  );
}
