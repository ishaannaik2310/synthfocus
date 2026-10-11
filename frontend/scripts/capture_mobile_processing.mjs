import { chromium } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/ishaa/.gemini/antigravity/brain/7fa2091a-8893-40fb-a1d3-3c1e2df418cb";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000/run...");
  await page.goto("http://localhost:3000/run");
  const chip = page.getByRole("button", { name: /KavachHydrate/i });
  await chip.click();
  const runBtn = page.getByRole("button", { name: /Run the Focus Group/i });
  await runBtn.click();

  console.log("Waiting for Batch 1 persona cards...");
  await page.waitForSelector("text=The Zingy Gen-Z Trend Chaser", { timeout: 30000 });
  await page.waitForTimeout(600);

  console.log("Capturing run_processing_mobile_375px.png...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "run_processing_mobile_375px.png") });
  console.log("Done! Canceling simulation...");
  
  // Cancel the simulation
  const cancelBtn = page.getByRole("button", { name: /Cancel Simulation/i });
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
  }

  await context.close();
  await browser.close();
}

main().catch(console.error);
