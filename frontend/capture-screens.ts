import { chromium } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

async function main() {
  const screenshotsDir = path.resolve(__dirname, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

  // 1. Capture Input Screen
  console.log("Capturing 01_input.png...");
  await page.screenshot({
    path: path.join(screenshotsDir, "01_input.png"),
    fullPage: true,
  });

  // 2. Click sample chip to prefill brief
  console.log("Selecting KavachHydrate sample chip...");
  await page.getByRole("button", { name: /KavachHydrate/i }).click();

  // 3. Click Run simulation
  console.log("Starting simulation run...");
  await page.getByRole("button", { name: /Run the Focus Group/i }).click();

  // 4. Wait for processing state & throttling countdown
  console.log("Waiting for Batch 1 completion and throttling countdown...");
  // Throttling or batch 1 completes around 10-18 seconds in
  await page.waitForSelector("text=Rate guard", { timeout: 45000 });
  await page.waitForTimeout(2000); // Wait for countdown animation to settle

  console.log("Capturing 02_processing_throttled.png...");
  await page.screenshot({
    path: path.join(screenshotsDir, "02_processing_throttled.png"),
    fullPage: false,
  });

  // 5. Test 429 busy by initiating a second concurrent request while run 1 is active
  console.log("Opening second tab to test 429 semaphore busy lock...");
  const page2 = await context.newPage();
  await page2.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page2.getByRole("button", { name: /PipelineForge/i }).click();
  await page2.getByRole("button", { name: /Run the Focus Group/i }).click();

  console.log("Waiting for Engine Busy error banner on second tab...");
  await page2.waitForSelector("text=Engine Busy", { timeout: 15000 });

  console.log("Capturing 03_busy_429.png...");
  await page2.screenshot({
    path: path.join(screenshotsDir, "03_busy_429.png"),
    fullPage: false,
  });
  await page2.close();

  // 6. Switch back to first tab and wait for final results
  console.log("Waiting for primary simulation to complete (~60-80s total)...");
  await page.waitForSelector("text=The Room Has Spoken.", { timeout: 120000 });
  await page.waitForTimeout(2000); // Give charts and animation time to settle

  console.log("Capturing 04_results.png...");
  await page.screenshot({
    path: path.join(screenshotsDir, "04_results.png"),
    fullPage: true,
  });

  await browser.close();
  console.log("All screenshots captured successfully in:", screenshotsDir);
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
