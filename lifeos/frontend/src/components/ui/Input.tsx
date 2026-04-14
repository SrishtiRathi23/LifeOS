import clsx from "clsx";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-terracotta focus:shadow-glow",
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "min-h-28 w-full rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink outline-none transition focus:border-terracotta focus:shadow-glow",
        props.className
      )}
    />
  );
}
