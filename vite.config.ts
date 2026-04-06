import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor libs (cached long-term)
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          // UI library chunk
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-tabs", "@radix-ui/react-tooltip", "@radix-ui/react-avatar", "@radix-ui/react-dropdown-menu", "lucide-react"],
          // Date/utility libs
          "vendor-utils": ["date-fns", "recharts"],
        },
      },
    },
  },
}));
