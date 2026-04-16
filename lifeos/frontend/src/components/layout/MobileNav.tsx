import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { sectionRegistry, type SectionItem } from "@/utils/sections";
import { MobileMoreDrawer } from "./MobileMoreDrawer";

export function MobileNav() {
  // Show only top 4 sections normally
  const items = sectionRegistry.filter((item: SectionItem) => item.mobilePrimary).slice(0, 4);

  return (
    <nav className="no-print fixed inset-x-3 bottom-3 z-40 rounded-full border border-line/70 bg-card/95 p-1 px-3 shadow-glow md:hidden">
      <div className="flex items-center justify-between gap-1">
        {items.map((item: SectionItem) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex flex-1 flex-col items-center gap-1 rounded-full py-2 text-[10px] sm:text-[11px] font-medium transition-all",
                  isActive ? "bg-parchment text-terracotta" : "text-ink/60"
                )
              }
            >
              <Icon size={18} />
              <span className="truncate w-full text-center px-0.5">
                {item.title.split("/")[0].split(" ")[0]}
              </span>
            </NavLink>
          );
        })}
        <div className="flex flex-1 justify-center">
          <MobileMoreDrawer />
        </div>
      </div>
    </nav>
  );
}
