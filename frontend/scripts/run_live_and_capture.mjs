import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "C:/Users/ishaa/.gemini/antigravity/brain/7fa2091a-8893-40fb-a1d3-3c1e2df418cb";

async function main() {
  console.log("Starting Live E2E Simulation & Visual Motion Capture...");
  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // 1. Desktop Context with Video Recording (1280 x 800)
  // -------------------------------------------------------------
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: ARTIFACT_DIR,
      size: { width: 1280, height: 800 },
    },
  });

  const page = await context.newPage();

  // --- LANDING PAGE WALKTHROUGH ---
  console.log("Navigating to landing page http://localhost:3000/ ...");
  await page.goto("http://localhost:3000/");
  await page.waitForTimeout(1000); // Allow hero entrance

  console.log("Capturing landing_desktop.png & motion_frame_1_hero.png...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "landing_desktop.png") });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "motion_frame_1_hero.png") });

  // Smooth scroll down to How It Works
  console.log("Scrolling to How It Works...");
  await page.evaluate(() => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  });
  await page.waitForTimeout(1200); // Observe whileInView reveal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "motion_frame_2_how_it_works.png") });

  // Smooth scroll down to Example Card
  console.log("Scrolling to Sample Result...");
  await page.evaluate(() => {
    document.getElementById("example")?.scrollIntoView({ behavior: "smooth" });
  });
  await page.waitForTimeout(1400); // Observe card reveal & score bar fill
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "motion_frame_3_sample_card.png") });

  // Smooth scroll down to Final CTA
  console.log("Scrolling to Final CTA...");
  await page.evaluate(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "motion_frame_4_final_cta.png") });

  // Navigate to /run
  console.log("Clicking 'Run simulation' CTA to navigate to /run...");
  const runCta = page.getByRole("link", { name: /Run simulation/i }).first();
  await runCta.click();
  await page.waitForURL("**/run");
  await page.waitForTimeout(800);

  // Capture /run input desktop
  console.log("Capturing run_input_desktop.png & motion_frame_5_input.png...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "run_input_desktop.png") });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "motion_frame_5_input.png") });

  // --- REAL LIVE SIMULATION WITH BACKEND ---
  console.log("Clicking KavachHydrate sample chip...");
  const sampleChip = page.getByRole("button", { name: /KavachHydrate/i });
  await sampleChip.click();
  await page.waitForTimeout(500);

  console.log("Starting real live simulation via 'Run the Focus Group'...");
  const runButton = page.getByRole("button", { name: /Run the Focus Group/i });
  await runButton.click();
  const startTime = Date.now();

  // Wait for processing state to become active
  console.log("Waiting for processing state...");
  await page.waitForSelector("text=Batch", { timeout: 15000 });

  // Wait for Batch 1 personas to be evaluated and throttling pause to show
  console.log("Waiting for Batch 1 and throttle timer...");
  await page.waitForSelector("text=The Zingy Gen-Z Trend Chaser", { timeout: 35000 });
  await page.waitForSelector("text=The Crunch-Time Cooking Mom", { timeout: 35000 });
  
  // Mid-throttle screenshot
  console.log("Capturing live_run_processing_desktop.png...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_run_processing_desktop.png") });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "run_processing_desktop.png") });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "motion_frame_6_processing.png") });

  // Wait for the final results screen ("The Room Has Spoken.")
  console.log("Waiting for final_report and results screen (up to 180s)...");
  await page.waitForSelector("text=The Room Has Spoken.", { timeout: 180000 });
  const endTime = Date.now();
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);
  console.log(`REAL SIMULATION COMPLETE! Total duration: ${durationSeconds} seconds.`);

  // Settle animations
  await page.waitForTimeout(1500);

  // Results screenshots
  console.log("Capturing live_run_results_desktop.png...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_run_results_desktop.png") });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "run_results_desktop.png") });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "motion_frame_7_results.png") });

  // Mobile results screenshot from this exact live run
  console.log("Resizing viewport to 375x812 to capture run_results_mobile_375px.png...");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "run_results_mobile_375px.png") });

  // Close context to finalize video recording
  console.log("Closing context to finalize video...");
  const video = page.video();
  await context.close();
  if (video) {
    const rawVideoPath = await video.path();
    const finalVideoPath = path.join(ARTIFACT_DIR, "synthfocus_live_motion.webm");
    try {
      if (fs.existsSync(rawVideoPath)) {
        fs.copyFileSync(rawVideoPath, finalVideoPath);
        console.log(`Video saved to: ${finalVideoPath}`);
      }
    } catch (e) {
      console.error("Error copying video:", e);
    }
  }

  // -------------------------------------------------------------
  // 2. Mobile (375x812) Viewport Captures (Landing & Input)
  // -------------------------------------------------------------
  console.log("Capturing Mobile Landing & Input screens...");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto("http://localhost:3000/");
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "landing_mobile_375px.png") });

  await mobilePage.goto("http://localhost:3000/run");
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, "run_input_mobile_375px.png") });

  await mobileContext.close();

  // -------------------------------------------------------------
  // 3. 429 Busy State Captures (Desktop & Mobile)
  // -------------------------------------------------------------
  console.log("Capturing 429 Busy State screens...");
  const busyContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const busyPage = await busyContext.newPage();
  await busyPage.route("**/api/simulate-focus-group", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        detail: "System is busy with another simulation.",
        code: "busy",
      }),
    });
  });

  await busyPage.goto("http://localhost:3000/run");
  const busyChip = busyPage.getByRole("button", { name: /KavachHydrate/i });
  await busyChip.click();
  const busyRunBtn = busyPage.getByRole("button", { name: /Run the Focus Group/i });
  await busyRunBtn.click();
  await busyPage.waitForSelector("text=Wrapping up the last run", { timeout: 10000 });
  await busyPage.waitForTimeout(600);
  await busyPage.screenshot({ path: path.join(ARTIFACT_DIR, "run_busy_429_desktop.png") });

  // 429 on mobile
  await busyPage.setViewportSize({ width: 375, height: 812 });
  await busyPage.waitForTimeout(400);
  await busyPage.screenshot({ path: path.join(ARTIFACT_DIR, "run_busy_429_mobile_375px.png") });

  await busyContext.close();
  await browser.close();

  console.log("=== ALL CAPTURES AND LIVE RUN SUCCESSFULLY COMPLETED ===");
  console.log(`Simulation Duration: ${durationSeconds}s`);
}

main().catch((err) => {
  console.error("Error executing script:", err);
  process.exit(1);
});
