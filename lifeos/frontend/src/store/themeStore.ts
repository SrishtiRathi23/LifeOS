import { create } from "zustand";
import type { ThemeName, ThemeOption } from "@/types/theme";

const THEME_KEY = "lifeos-theme";
const SIDEBAR_KEY = "lifeos-sidebar-collapsed";

export const themeOptions: ThemeOption[] = [
  { id: "parchment", label: "Parchment", preview: "linear-gradient(135deg, #FDF6EE, #E8C4A0)" },
  { id: "midnight-sage", label: "Midnight Sage", preview: "linear-gradient(135deg, #10261E, #D9D1B4)" },
  { id: "lavender-dream", label: "Lavender Dream", preview: "linear-gradient(135deg, #EAE1F7, #F2D4C8)" },
  { id: "ocean-mist", label: "Ocean Mist", preview: "linear-gradient(135deg, #DDE8EC, #A7C8C9)" },
  { id: "cherry-blossom", label: "Cherry Blossom", preview: "linear-gradient(135deg, #FFE7EC, #F7F4EF)" },
  { id: "charcoal-linen", label: "Charcoal Linen", preview: "linear-gradient(135deg, #2D2521, #F2EBDD)" }
];

type ThemeState = {
  theme: ThemeName;
  sidebarCollapsed: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleSidebar: () => void;
};

function getStoredTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_KEY) as ThemeName | null;
  return stored ?? "parchment";
}

function getStoredSidebar() {
  return localStorage.getItem(SIDEBAR_KEY) === "true";
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),
  sidebarCollapsed: getStoredSidebar(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return { sidebarCollapsed: next };
    })
}));
