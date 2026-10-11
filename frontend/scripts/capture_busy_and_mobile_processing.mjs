import { chromium } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/ishaa/.gemini/antigravity/brain/7fa2091a-8893-40fb-a1d3-3c1e2df418cb";

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1. Capture 429 busy state (Desktop 1280x800)
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
  await busyPage.waitForTimeout(500);
  const chip = busyPage.getByRole("button", { name: /KavachHydrate/i });
  await chip.click();
  
  // Click Run button to trigger 429
  const runBtn = busyPage.getByRole("button", { name: /Run the Focus Group/i });
  await runBtn.click();
  
  // Wait for ErrorBanner
  await busyPage.waitForSelector("text=Engine Busy", { timeout: 10000 });
  await busyPage.waitForTimeout(500);
  await busyPage.screenshot({ path: path.join(ARTIFACT_DIR, "run_busy_429_desktop.png") });
  console.log("Captured run_busy_429_desktop.png");

  // Resize to 375x812 for mobile 429 screenshot
  await busyPage.setViewportSize({ width: 375, height: 812 });
  await busyPage.waitForTimeout(500);
  await busyPage.screenshot({ path: path.join(ARTIFACT_DIR, "run_busy_429_mobile_375px.png") });
  console.log("Captured run_busy_429_mobile_375px.png");

  await busyContext.close();

  // 2. Capture mobile processing screen (375x812) with mocked processing SSE
  const mobileProcContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });
  const mobileProcPage = await mobileProcContext.newPage();
  
  await mobileProcPage.route("**/api/simulate-focus-group", async (route) => {
    const sse = [
      `event: start\ndata: {"status":"started","total_personas":10,"total_batches":5,"batch_size":2,"message":"Starting panel..."}\n\n`,
      `event: batch_start\ndata: {"status":"batch_running","batch_index":0,"total_batches":5,"message":"Grilling Batch 1...","personas":[{"id":"gen_z","name":"The Zingy Gen-Z Trend Chaser","avatar":"⚡"},{"id":"mom","name":"The Crunch-Time Cooking Mom","avatar":"⏰"}]}\n\n`,
      `event: batch_complete\ndata: {"status":"batch_done","batch_index":0,"total_batches":5,"personas_evaluated":[{"persona_id":"gen_z","persona_name":"The Zingy Gen-Z Trend Chaser","score_out_of_10":8,"primary_objection":"Looks too corporate","one_sentence_critique":"Aesthetic slaps, packaging is clean.","buy_readiness":true,"key_frustrations":["sachet count"],"trigger_words":["stevia"]},{"persona_id":"mom","persona_name":"The Crunch-Time Cooking Mom","score_out_of_10":4,"primary_objection":"Expensive for daily hydration","one_sentence_critique":"Kids will complain about the stevia aftertaste.","buy_readiness":false,"key_frustrations":["price"],"trigger_words":["₹499"]}],"message":"Batch 1 done"}\n\n`,
      `event: throttling\ndata: {"status":"sleeping","batch_index":0,"seconds_remaining":13,"message":"Rate guard pause"}\n\n`,
    ].join("");

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
      body: sse,
    });
  });

  await mobileProcPage.goto("http://localhost:3000/run");
  await mobileProcPage.waitForTimeout(500);
  const mChip = mobileProcPage.getByRole("button", { name: /KavachHydrate/i });
  await mChip.click();
  const mRunBtn = mobileProcPage.getByRole("button", { name: /Run the Focus Group/i });
  await mRunBtn.click();

  await mobileProcPage.waitForSelector("text=The Zingy Gen-Z Trend Chaser", { timeout: 10000 });
  await mobileProcPage.waitForTimeout(600);
  await mobileProcPage.screenshot({ path: path.join(ARTIFACT_DIR, "run_processing_mobile_375px.png") });
  console.log("Captured run_processing_mobile_375px.png");

  await mobileProcContext.close();
  await browser.close();

  console.log("=== CAPTURES COMPLETE ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
