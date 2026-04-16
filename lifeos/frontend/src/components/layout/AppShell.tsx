import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { ThemeSwitcher } from "../shared/ThemeSwitcher";
import { useThemeStore } from "@/store/themeStore";
import { useSession } from "@/hooks/useSession";
import { AuthPage } from "@/pages/AuthPage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { printPage } from "@/utils/print";

export function AppShell() {
  const location = useLocation();
  const sidebarCollapsed = useThemeStore((state: { sidebarCollapsed: boolean }) => state.sidebarCollapsed);
  const session = useSession();
  useOnlineStatus();
  useKeyboardShortcuts(printPage);

  if (session.isLoading) {
    return <div className="min-h-screen bg-cream" />;
  }

  if (session.isError) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="paper-noise fixed inset-0 pointer-events-none opacity-50" />
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? "md:pl-24" : "md:pl-72"}`}>
          <TopBar />
          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="pb-32 md:pb-10"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
        <ThemeSwitcher />
        <MobileNav />
      </div>
    </div>
  );
}
