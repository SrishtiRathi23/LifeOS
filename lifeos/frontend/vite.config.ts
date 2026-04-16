import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: "brotliCompress", ext: ".br" })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["lucide-react", "framer-motion", "@radix-ui/react-dialog", "@radix-ui/react-popover"],
          "vendor-charts": ["recharts"],
          "vendor-editor": ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-character-count", "@tiptap/extension-placeholder"],
          "vendor-utils": ["axios", "dayjs", "zod", "zustand"]
        }
      }
    }
  }
});
