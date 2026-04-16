import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { sectionRegistry } from "./utils/sections";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      ...sectionRegistry.map((section) => ({
        index: section.path === "/",
        path: section.path === "/" ? undefined : section.path.slice(1),
        lazy: async () => {
          const module = await section.loader();
          const exportName =
            Object.keys(module).find((key) => key.endsWith("Page")) ??
            "default";

          return {
            Component: (module[exportName] ?? module.default) as never
          };
        }
      })),
      {
        path: "privacy",
        lazy: async () => {
          const module = await import("./pages/PrivacyPage");
          return { Component: module.default };
        }
      },
      {
        path: "terms",
        lazy: async () => {
          const module = await import("./pages/TermsPage");
          return { Component: module.default };
        }
      }
    ]
  }
]);
