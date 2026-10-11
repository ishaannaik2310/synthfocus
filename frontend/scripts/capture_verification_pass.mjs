import { chromium } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/ishaa/.gemini/antigravity/brain/7fa2091a-8893-40fb-a1d3-3c1e2df418cb";

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Full-Page Screenshot of Landing Page (1280px)
  console.log("Capturing 1280px full-page landing screenshot...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto("http://localhost:3000/");
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "landing_fullpage_1280px.png"),
    fullPage: true,
  });
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "landing_desktop.png"),
  });
  console.log("Saved landing_fullpage_1280px.png and landing_desktop.png");

  // 2. Mobile Full-Page Screenshot of Landing Page (375px)
  console.log("Capturing 375px mobile full-page landing screenshot...");
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000/");
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, "landing_fullpage_375px.png"),
    fullPage: true,
  });
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, "landing_mobile_375px.png"),
  });
  console.log("Saved landing_fullpage_375px.png and landing_mobile_375px.png");

  // 3. /run Input Screen (1280px & 375px)
  console.log("Capturing /run input screens...");
  await desktopPage.goto("http://localhost:3000/run");
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "run_input_radius_1280px.png"),
  });
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "run_input_desktop.png"),
  });

  await mobilePage.goto("http://localhost:3000/run");
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, "run_input_mobile_375px.png"),
  });
  console.log("Saved run_input screens");

  // 4. /run Results Screen with new radius tokens (1280px & 375px)
  console.log("Capturing /run results screens with mocked SSE...");
  const resultsContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const resultsPage = await resultsContext.newPage();

  await resultsPage.route("**/api/simulate-focus-group", async (route) => {
    const ssePayload = [
      `event: start\ndata: {"status":"started","total_personas":10,"total_batches":5,"batch_size":2,"message":"Starting panel..."}\n\n`,
      `event: batch_start\ndata: {"status":"batch_running","batch_index":0,"total_batches":5,"message":"Grilling Batch 1...","personas":[{"id":"gen_z","name":"The Zingy Gen-Z Trend Chaser","avatar":"⚡"},{"id":"mom","name":"The Crunch-Time Cooking Mom","avatar":"⏰"}]}\n\n`,
      `event: batch_complete\ndata: {"status":"batch_done","batch_index":0,"total_batches":5,"personas_evaluated":[{"persona_id":"gen_z","persona_name":"The Zingy Gen-Z Trend Chaser","score_out_of_10":8,"primary_objection":"Looks too corporate","one_sentence_critique":"Aesthetic slaps, packaging is clean.","buy_readiness":true,"key_frustrations":["sachet count"],"trigger_words":["stevia"]},{"persona_id":"mom","persona_name":"The Crunch-Time Cooking Mom","score_out_of_10":4,"primary_objection":"Expensive for daily hydration","one_sentence_critique":"Kids will complain about the stevia aftertaste.","buy_readiness":false,"key_frustrations":["price"],"trigger_words":["₹499"]}],"message":"Batch 1 done"}\n\n`,
      `event: final_report\ndata: {"metrics":{"average_score":6.0,"buy_ready_count":5,"total_personas":10,"min_score":4,"max_score":8,"score_spread":1.41},"executive_summary":"Strong aesthetic and health appeal with expected price friction in tier-2 cohorts.","playbook_markdown":"# Objection Playbook\\n\\n## Price Barrier\\n* Introduce a 3-sachet starter pack at lower price point.\\n* Bundle free electrolytes with first order.\\n\\n[Official Research](https://example.com/research)","persona_results":[{"persona_id":"gen_z","persona_name":"The Zingy Gen-Z Trend Chaser","score_out_of_10":8,"primary_objection":"Looks too corporate","one_sentence_critique":"Aesthetic slaps, packaging is clean.","buy_readiness":true,"key_frustrations":["sachet count"],"trigger_words":["stevia"]},{"persona_id":"mom","persona_name":"The Crunch-Time Cooking Mom","score_out_of_10":4,"primary_objection":"Expensive for daily hydration","one_sentence_critique":"Kids will complain about the stevia aftertaste.","buy_readiness":false,"key_frustrations":["price"],"trigger_words":["₹499"]}],"disclaimer":"Synthetic opinions from simulated personas, not real market data."}\n\n`,
    ].join("");

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
      body: ssePayload,
    });
  });

  await resultsPage.goto("http://localhost:3000/run");
  const chip = resultsPage.getByRole("button", { name: /KavachHydrate/i });
  await chip.click();
  const runBtn = resultsPage.getByRole("button", { name: /Run the Focus Group/i });
  await runBtn.click();

  await resultsPage.waitForSelector("text=The Room Has Spoken.", { timeout: 15000 });
  await resultsPage.waitForTimeout(1000);

  await resultsPage.screenshot({
    path: path.join(ARTIFACT_DIR, "run_results_radius_1280px.png"),
    fullPage: false,
  });
  await resultsPage.screenshot({
    path: path.join(ARTIFACT_DIR, "run_results_desktop.png"),
  });
  console.log("Saved run_results_radius_1280px.png and run_results_desktop.png");

  // Mobile results screenshot
  await resultsPage.setViewportSize({ width: 375, height: 812 });
  await resultsPage.waitForTimeout(500);
  await resultsPage.screenshot({
    path: path.join(ARTIFACT_DIR, "run_results_mobile_375px.png"),
  });
  console.log("Saved run_results_mobile_375px.png");

  await desktopContext.close();
  await mobileContext.close();
  await resultsContext.close();
  await browser.close();

  console.log("=== ALL POLISH VERIFICATION CAPTURES COMPLETED ===");
}

main().catch(console.error);
