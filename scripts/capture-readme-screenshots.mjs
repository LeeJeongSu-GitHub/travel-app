#!/usr/bin/env node
import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "assets", "readme");
const appUrl = process.env.README_CAPTURE_URL ?? "http://localhost:5173/kyoto-kobe-trip/";
const hubUrl = new URL("../", appUrl).toString();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 1,
});

async function load(url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(1800);
}

await load(`${hubUrl}?v=readme-snapshot`);
await page.screenshot({ path: path.join(outputDir, "hub.png"), fullPage: false });

await load(`${appUrl}?day=20&v=readme-snapshot`);
await page.screenshot({ path: path.join(outputDir, "itinerary-day2.png"), fullPage: false });

await page.getByRole("button", { name: /9번 키치키치 상세 보기/ }).click();
await page.getByText("메뉴판", { exact: true }).waitFor({ state: "visible" });
await page.screenshot({ path: path.join(outputDir, "place-detail.png"), fullPage: false });

await page.getByRole("button", { name: "닫기", exact: true }).click();
await page.getByRole("button", { name: "저장", exact: true }).last().click();
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(outputDir, "saved-records.png"), fullPage: false });

await browser.close();
console.log(`Captured README screenshots from ${appUrl}`);
