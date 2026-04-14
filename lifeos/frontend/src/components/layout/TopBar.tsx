import { useMemo } from "react";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import { sectionRegistry, type SectionItem } from "@/utils/sections";

export function TopBar() {
  const location = useLocation();
  const section = useMemo(
    () => sectionRegistry.find((item: SectionItem) => item.path === location.pathname) ?? sectionRegistry[0],
    [location.pathname]
  );

  return (
    <header className="no-print sticky top-0 z-20 border-b border-line/60 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <div>
          <p className="font-accent text-2xl text-terracotta">LifeOS</p>
          <h1 className="font-serif text-3xl italic text-ink">{section.title}</h1>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl italic text-ink">{dayjs().format("dddd")}</p>
          <p className="text-sm text-ink/60">{dayjs().format("DD MMMM YYYY")}</p>
        </div>
      </div>
    </header>
  );
}
