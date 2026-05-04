import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={clsx("rounded-lg border border-line bg-card/95 p-4 shadow-glow sm:p-5", className)} {...props}>
      {children}
    </div>
  );
}
