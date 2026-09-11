import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

function normalizeBasePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

function getBuildBase() {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) return normalizeBasePath(explicitBase);

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop()?.trim();
  if (!repositoryName) return "/";
  if (repositoryName.toLowerCase().endsWith(".github.io")) return "/";
  return normalizeBasePath(repositoryName);
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? getBuildBase() : "/",
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        hub: resolve(repoRoot, "index.html"),
        guam: resolve(repoRoot, "guam-trip/index.html"),
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
