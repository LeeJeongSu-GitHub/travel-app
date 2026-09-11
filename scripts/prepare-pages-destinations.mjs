#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const travelRoot = path.join(root, "travel");
const clientRoot = path.join(root, "dist", "client");
const generatedRoot = path.join(clientRoot, "travel");

if (!existsSync(travelRoot) || !existsSync(clientRoot)) throw new Error("Missing travel or Pages build directory");

const slugs = readdirSync(travelRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => existsSync(path.join(travelRoot, slug, "index.html")) && existsSync(path.join(travelRoot, slug, "trip.json")));

for (const slug of slugs) {
  const generatedIndex = path.join(generatedRoot, slug, "index.html");
  if (!existsSync(generatedIndex)) throw new Error(`Missing generated destination page: ${generatedIndex}`);

  const publicDestinationRoot = path.join(clientRoot, slug);
  mkdirSync(publicDestinationRoot, { recursive: true });
  copyFileSync(generatedIndex, path.join(publicDestinationRoot, "index.html"));

  const manifest = path.join(clientRoot, "manifest.webmanifest");
  if (existsSync(manifest)) copyFileSync(manifest, path.join(publicDestinationRoot, "manifest.webmanifest"));
}

if (existsSync(generatedRoot)) rmSync(generatedRoot, { recursive: true, force: true });
console.log(`Preserved ${slugs.length} destination URL path(s) at the Pages artifact root.`);
