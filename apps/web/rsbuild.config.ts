import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: "./index.html",
  },
  source: {
    entry: {
      index: "./src/main.tsx",
    },
    alias: {
      "@allorai/types": path.resolve(__dirname, "../../packages/types/src"),
      "@allorai/ui-components": path.resolve(__dirname, "../../packages/ui-components/src"),
      "@allorai/utils": path.resolve(__dirname, "../../packages/utils/src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: process.env.VITE_API_GATEWAY_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  dev: {
    hmr: true,
  },
});
