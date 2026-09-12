import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const travelRoot = resolve(repoRoot, "travel");
const pageRoot = resolve(repoRoot, "page");

function getDestinationInputs() {
  return Object.fromEntries(
    readdirSync(pageRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((slug) => existsSync(resolve(pageRoot, slug, "index.html")) && existsSync(resolve(travelRoot, slug, "trip.json")))
      .map((slug) => [`${slug}/index`, resolve(pageRoot, slug, "index.html")]),
  );
}

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

export default defineConfig({
  base: getBuildBase(),
  build: {
    emptyOutDir: false,
    outDir: "dist/client",
    rollupOptions: {
      input: {
        hub: resolve(repoRoot, "index.html"),
        ...getDestinationInputs(),
      },
    },
  },
  plugins: [react()],
});
