import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { sectionRegistry, type SectionItem } from "@/utils/sections";

export function MobileNav() {
  const items = sectionRegistry.filter((item: SectionItem) => item.mobilePrimary).slice(0, 5);

  return (
    <nav className="no-print fixed inset-x-3 bottom-3 z-40 rounded-full border border-line/70 bg-card/95 p-2 shadow-glow md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item: SectionItem) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx("flex flex-col items-center gap-1 rounded-full px-2 py-2 text-[11px] text-ink/70", isActive && "bg-parchment text-terracotta")
              }
            >
              <Icon size={17} />
              <span>{item.title.split(" ")[0]}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
