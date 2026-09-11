import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/travel/" : "/",
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        hub: resolve(repoRoot, "index.html"),
        kyotoKobe: resolve(repoRoot, "kyoto-kobe-trip/index.html"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
  },
  plugins: [react()],
}));
