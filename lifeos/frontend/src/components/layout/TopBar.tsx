import { useMemo } from "react";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import { sectionRegistry, type SectionItem } from "@/utils/sections";
import { ReminderBell } from "@/components/shared/ReminderBell";

export function TopBar() {
  const location = useLocation();
  const section = useMemo(
    () => sectionRegistry.find((item: SectionItem) => item.path === location.pathname) ?? sectionRegistry[0],
    [location.pathname]
  );

  return (
    <header className="no-print sticky top-0 z-20 border-b border-line/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
        <div className="min-w-0">
          <p className="font-accent text-xl text-terracotta md:text-2xl">LifeOS</p>
          <h1 className="truncate font-serif text-2xl font-semibold text-ink md:text-3xl">{section.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="font-serif text-xl font-semibold text-ink md:text-2xl">{dayjs().format("dddd")}</p>
            <p className="text-xs text-ink/60 md:text-sm">{dayjs().format("DD MMMM YYYY")}</p>
          </div>
          <ReminderBell />
        </div>
      </div>
    </header>
  );
}
