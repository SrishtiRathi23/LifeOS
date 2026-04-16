import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import * as Sentry from "@sentry/react";
import { router } from "./router";
import "./styles/globals.css";
import "./styles/themes.css";
import "./styles/print.css";

const queryClient = new QueryClient();

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  enabled: import.meta.env.MODE === "production",
  integrations: [Sentry.browserTracingIntegration()],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </ConfirmProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
