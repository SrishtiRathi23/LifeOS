import * as Popover from "@radix-ui/react-popover";
import { Palette } from "lucide-react";
import clsx from "clsx";
import { themeOptions, useThemeStore } from "@/store/themeStore";
import type { ThemeOption } from "@/types/theme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="no-print fixed bottom-24 right-4 z-40 rounded-full border border-line bg-card p-4 text-terracotta shadow-glow transition hover:-translate-y-0.5 md:bottom-6"
        >
          <Palette size={20} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={14}
          className="z-50 w-72 rounded-[1.75rem] border border-line bg-card/95 p-4 shadow-glow backdrop-blur"
        >
          <p className="font-serif text-2xl italic text-ink">Choose your mood</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {themeOptions.map((option: ThemeOption) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTheme(option.id)}
                className={clsx(
                  "rounded-[1.25rem] border p-3 text-left transition hover:-translate-y-0.5",
                  option.id === theme ? "border-terracotta bg-parchment" : "border-line bg-cream"
                )}
              >
                <span className="block h-10 rounded-full" style={{ background: option.preview }} />
                <span className="mt-2 block text-sm text-ink">{option.label}</span>
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
