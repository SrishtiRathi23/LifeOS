import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, Sparkles } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionRegistry, type SectionItem } from "@/utils/sections";
import { useThemeStore } from "@/store/themeStore";
import { useSession } from "@/hooks/useSession";
import { api } from "@/utils/api";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();
  const session = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = useMutation({
    mutationFn: async () => api.post("/auth/logout"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.clear();
      navigate("/");
      toast.success("Logged out. See you soon ✨");
    }
  });

  return (
    <aside
      className={clsx(
        "no-print fixed inset-y-0 left-0 z-30 hidden border-r border-line/70 bg-parchment/95 backdrop-blur md:flex md:flex-col",
        sidebarCollapsed ? "w-24" : "w-72"
      )}
    >
      <div className="flex items-center justify-between px-5 py-6">
        <div className={clsx("overflow-hidden transition-all", sidebarCollapsed && "w-0 opacity-0")}>
          <p className="font-accent text-3xl text-terracotta">LifeOS</p>
          <p className="text-sm text-ink/60">Your personal operating system</p>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-full border border-line bg-card p-3 text-ink transition hover:-translate-y-0.5 hover:shadow-glow"
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {sectionRegistry.map((section: SectionItem) => {
          const Icon = section.icon;
          return (
            <NavLink
              key={section.path}
              to={section.path}
              end={section.path === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-all hover:bg-card/90 hover:shadow-glow",
                  isActive
                    ? "bg-terracotta/10 text-terracotta font-medium shadow-sm"
                    : "text-ink/70 hover:text-ink",
                  sidebarCollapsed && "justify-center"
                )
              }
            >
              <Icon size={17} />
              {!sidebarCollapsed && <span>{section.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="mx-4 mb-6 space-y-3">
        {session.data && !sidebarCollapsed && (
          <div className="rounded-[1.5rem] border border-line bg-card/80 px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">{session.data.name}</p>
            <p className="truncate text-xs text-ink/50">{session.data.email}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout.mutate()}
          className={clsx(
            "flex w-full items-center gap-3 rounded-full border border-line/60 bg-card/70 px-4 py-2.5 text-sm text-ink/60 transition hover:bg-card hover:text-ink hover:shadow-glow",
            sidebarCollapsed && "justify-center"
          )}
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
        {sidebarCollapsed && (
          <div className="flex justify-center">
            <Sparkles className="text-terracotta" size={16} />
          </div>
        )}
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2">
            <Sparkles className="text-terracotta shrink-0" size={14} />
            <p className="text-xs text-ink/50">Beautiful planning, one day at a time.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
