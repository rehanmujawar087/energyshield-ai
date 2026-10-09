#!/usr/bin/env node
/**
 * Smoke test for the EnergyShield AI dashboard.
 *
 * - Spins up its own Vite dev server on a dedicated port (so it never
 *   collides with a teammate's own `npm run dev` on 5173).
 * - Loads the page in headless Chromium at 1440x900 and 1024x768.
 * - Fails (non-zero exit) on any browser console error or page error.
 * - Clicks through the interactions that exist at the current build stage
 *   — every check is wrapped so a feature that doesn't exist yet is
 *   reported as SKIPPED, not a crash, since this same script runs after
 *   every stage of the build.
 * - Saves screenshots to docs/images/.
 *
 * Usage: node scripts/smoke.mjs [--keep-open]
 */

import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "..");
const SCREENSHOT_DIR = path.resolve(FRONTEND_DIR, "..", "docs", "images");
const PORT = 4319;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const results = []; // { name, status: "pass" | "fail" | "skip", detail }

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  const icon = status === "pass" ? "✅" : status === "skip" ? "⏭️ " : "❌";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Dev server did not respond at ${url} within ${timeoutMs}ms`);
}

/** Run a check; never throw — record pass/fail/skip and keep going. */
async function check(name, fn) {
  try {
    const skipped = await fn();
    if (skipped === "skip") record(name, "skip", "element not present at this build stage");
    else record(name, "pass");
  } catch (err) {
    record(name, "fail", err.message);
  }
}

/**
 * `server.kill()` alone only kills the immediate child on Windows when the
 * process was spawned with `shell: true` (it kills the cmd.exe wrapper,
 * not the grandchild Vite/node process actually bound to the port, which
 * then lingers and can keep this script's event loop alive). Fall back to
 * `taskkill /T` (kill the whole process tree) there.
 */
function killServerTree(server) {
  if (process.platform === "win32" && server.pid) {
    try {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
      return;
    } catch {
      // process may already be gone — fall through to the normal kill below
    }
  }
  server.kill();
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  console.log(`Starting Vite dev server on port ${PORT}...`);
  // --host 127.0.0.1 (not just the default, which can bind IPv6-only "::1"
  // on some setups) so our IPv4 fetch/goto calls can actually reach it.
  const server = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
    cwd: FRONTEND_DIR,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Hard watchdog: this script must never hang indefinitely (observed once
  // in a sandboxed environment where headless Chromium launched but never
  // progressed). Kills the dev server and exits non-zero if we blow past a
  // generous budget for the whole run.
  const watchdog = setTimeout(() => {
    console.error("\nSMOKE TEST WATCHDOG: exceeded 90s hard limit, aborting.");
    killServerTree(server);
    process.exit(1);
  }, 90000);
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d.toString()));
  server.stderr.on("data", (d) => (serverLog += d.toString()));

  const consoleErrors = [];
  const pageErrors = [];

  try {
    await waitForServer(BASE_URL);

    const browser = await chromium.launch({ args: ["--no-sandbox"] });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(15000);

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // --- Desktop viewport ---------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    // "load" rather than "networkidle" — map tile requests can keep the
    // network busy indefinitely in a sandboxed/offline environment, and
    // we don't need every tile loaded to check the app itself works.
    await page.goto(BASE_URL, { waitUntil: "load" });

    await check("header renders", async () => {
      await page.getByText("EnergyShield AI").first().waitFor({ timeout: 5000 });
    });

    await check("data source pill renders", async () => {
      const count = await page.locator("[data-testid='data-source-pill']").count();
      if (count === 0) return "skip";
      await page.locator("[data-testid='data-source-pill']").first().waitFor();
    });

    await check("KPI strip renders 4 cards", async () => {
      const count = await page.locator("[data-testid='kpi-card']").count();
      if (count === 0) return "skip";
      if (count !== 4) throw new Error(`expected 4 KPI cards, found ${count}`);
    });

    await check("map renders", async () => {
      const count = await page.locator(".leaflet-container").count();
      if (count === 0) return "skip";
      await page.locator(".leaflet-container").first().waitFor();
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "hero.png"), fullPage: false });

    await check("about modal opens and closes", async () => {
      const btn = page.locator("[data-testid='about-button']");
      if ((await btn.count()) === 0) return "skip";
      await btn.first().click();
      await page.locator("[data-testid='about-modal']").waitFor({ timeout: 3000 });
      await page.keyboard.press("Escape");
      await page.locator("[data-testid='about-modal']").waitFor({ state: "detached", timeout: 3000 });
    });

    await check("corridor risk row opens detail drawer", async () => {
      const row = page.locator("[data-testid='risk-row']").first();
      if ((await row.count()) === 0) return "skip";
      await row.click();
      await page.locator("[data-testid='corridor-drawer']").waitFor({ timeout: 3000 });
      await page.locator("[data-testid='drawer-close']").click();
    });

    await check("tabs switch between panels", async () => {
      const tabs = page.locator("[data-testid^='tab-button-']");
      const count = await tabs.count();
      if (count === 0) return "skip";
      for (let i = 0; i < count; i++) {
        await tabs.nth(i).click();
      }
    });

    await check("inject headline flow shows a toast", async () => {
      const tab = page.locator("[data-testid='tab-button-risk']");
      if ((await tab.count()) > 0) await tab.click();
      const input = page.locator("[data-testid='inject-headline-input']");
      if ((await input.count()) === 0) return "skip";
      await input.fill("Tanker seized near Strait of Hormuz");
      await page.locator("[data-testid='inject-headline-submit']").click();
      await page.locator("[data-testid='toast']").first().waitFor({ timeout: 8000 });
    });

    await check("scenario run shows KPI results", async () => {
      const tab = page.locator("[data-testid='tab-button-scenario']");
      if ((await tab.count()) === 0) return "skip";
      await tab.click();
      const runBtn = page.locator("[data-testid='scenario-run']");
      if ((await runBtn.count()) === 0) return "skip";
      await runBtn.click();
      await page.locator("[data-testid='scenario-result']").waitFor({ timeout: 8000 });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "scenario.png") });
    });

    await check("procurement options render after scenario", async () => {
      const tab = page.locator("[data-testid='tab-button-procurement']");
      if ((await tab.count()) === 0) return "skip";
      await tab.click();
      const count = await page.locator("[data-testid='procurement-option']").count();
      if (count === 0) return "skip";
    });

    await check("reserves chart renders", async () => {
      const tab = page.locator("[data-testid='tab-button-reserves']");
      if ((await tab.count()) === 0) return "skip";
      await tab.click();
      const count = await page.locator("[data-testid='reserves-chart'] svg").count();
      if (count === 0) return "skip";
    });

    await check("pipeline run animates stages and shows total", async () => {
      const tab = page.locator("[data-testid='tab-button-pipeline']");
      if ((await tab.count()) === 0) return "skip";
      await tab.click();
      const runBtn = page.locator("[data-testid='pipeline-run']");
      if ((await runBtn.count()) === 0) return "skip";
      await runBtn.click();
      await page.locator("[data-testid='pipeline-total']").waitFor({ timeout: 10000 });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "pipeline.png") });
    });

    // --- Tablet viewport -------------------------------------------------
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    await check("no horizontal scroll at 1024px", async () => {
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      if (scrollWidth > clientWidth + 1) {
        throw new Error(`scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`);
      }
    });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "tablet-1024.png") });

    await browser.close();
  } finally {
    clearTimeout(watchdog);
    killServerTree(server);
  }

  console.log("\n--- Console errors captured ---");
  if (consoleErrors.length === 0) console.log("(none)");
  consoleErrors.forEach((e) => console.log("  " + e));

  console.log("\n--- Page errors captured ---");
  if (pageErrors.length === 0) console.log("(none)");
  pageErrors.forEach((e) => console.log("  " + e));

  const failed = results.filter((r) => r.status === "fail");
  const skipped = results.filter((r) => r.status === "skip");
  const passed = results.filter((r) => r.status === "pass");

  console.log(`\n${passed.length} passed, ${skipped.length} skipped, ${failed.length} failed.`);

  if (failed.length > 0 || consoleErrors.length > 0 || pageErrors.length > 0) {
    console.log("\nSMOKE TEST FAILED");
    process.exitCode = 1;
  } else {
    console.log("\nSMOKE TEST PASSED (see skipped checks for what wasn't covered)");
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exitCode = 1;
});
