import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Keeps API calls same-origin in dev so the httpOnly session cookie
      // is sent without CORS or SameSite=None complications.
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});