import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Pre-bundle libraries that are only loaded on some pages, so the dev server does not
  // discover them mid-session and reload the page (which also slows the browser tests).
  optimizeDeps: {
    include: ["recharts", "xlsx", "jspdf", "jspdf-autotable"],
  },
  build: {
    rollupOptions: {
      output: {
        // Keep large, rarely-changing libraries in their own cacheable chunks.
        manualChunks: {
          firebase: ["firebase/app", "firebase/app-check", "firebase/auth", "firebase/firestore", "firebase/storage"],
        },
      },
    },
  },
}));
