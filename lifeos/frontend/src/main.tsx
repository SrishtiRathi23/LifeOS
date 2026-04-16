import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { router } from "./router";
import "./styles/globals.css";
import "./styles/themes.css";
import "./styles/print.css";

const queryClient = new QueryClient();

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
