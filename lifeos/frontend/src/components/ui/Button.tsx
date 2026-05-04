import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  children: ReactNode;
};

export function Button({ asChild, variant = "primary", className, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={clsx(
        "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition duration-150 active:scale-[0.97]",
        variant === "primary" && "bg-terracotta text-white hover:-translate-y-0.5 hover:shadow-glow",
        variant === "secondary" && "border border-line bg-card text-ink hover:-translate-y-0.5 hover:shadow-glow",
        variant === "outline" && "border border-line bg-transparent text-ink hover:-translate-y-0.5 hover:bg-card hover:shadow-glow",
        variant === "ghost" && "text-ink/75 hover:bg-card",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
