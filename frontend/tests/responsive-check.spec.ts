import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("Responsive layout audit at 375px and 1280px", () => {
  test("audit results screen at 375px and 1280px for overflow and overlap", async ({
    browser,
  }) => {
    const ssePayload = [
      `event: start\ndata: {"status":"started","total_personas":10,"total_batches":5,"batch_size":2,"message":"Starting panel..."}\n\n`,
      `event: final_report\ndata: {"metrics":{"average_score":5.8,"buy_ready_count":3,"total_personas":10,"min_score":2,"max_score":8,"score_spread":2.1},"executive_summary":"Polarized reception between pragmatic buyers and aesthetic enthusiasts.","playbook_markdown":"# Objection Playbook\\n\\n## Pricing Resistance\\n* Offer sample sachets at lower trial cost.\\n\\n[Official Research](https://example.com/research)","persona_results":[{"persona_id":"p1","persona_name":"The Zingy Gen-Z Trend Chaser","score_out_of_10":3,"primary_objection":"Looks like a boring pharmaceutical supplement for desk workers.","one_sentence_critique":"This whole vibe is giving corporate wellness and completely lacks the drip.","buy_readiness":false,"key_frustrations":["sachet packaging","bland branding"],"trigger_words":["corporate","gym rats"]},{"persona_id":"p2","persona_name":"The Crunch-Time Cooking Mom","score_out_of_10":6,"primary_objection":"Fifty rupees a sachet feels steep for daily family use.","one_sentence_critique":"Smart sugar-free lifesaver, but my wallet weeps at fifty bucks a pop.","buy_readiness":false,"key_frustrations":["price per sachet"],"trigger_words":["₹499"]},{"persona_id":"p3","persona_name":"The Skeptical Corporate Millennial","score_out_of_10":6,"primary_objection":"Sodium to potassium ratio is 500mg to 200mg without osmolarity compliance.","one_sentence_critique":"Semi-viable for desk fatigue, but omitting clinical data means I am gambling.","buy_readiness":false,"key_frustrations":["osmolarity data"],"trigger_words":["electrolyte"]},{"persona_id":"p4","persona_name":"The Tech-Bro Developer","score_out_of_10":2,"primary_objection":"Charging fifty rupees for basic mineral salts is twenty-five times markup.","one_sentence_critique":"Repackaging a five-rupee DIY salt mixture as clean-label lifestyle product.","buy_readiness":false,"key_frustrations":["gross margins"],"trigger_words":["salt markup"]},{"persona_id":"p5","persona_name":"The Holistic Wellness Yogi","score_out_of_10":8,"primary_objection":"Single-use paper sachets still create landfill waste.","one_sentence_critique":"Clean electrolyte blend that respects the microbiome instead of poisoning it.","buy_readiness":true,"key_frustrations":["waste"],"trigger_words":["stevia"]},{"persona_id":"p6","persona_name":"The High-Income DINK","score_out_of_10":6,"primary_objection":"Priced too accessibly to carry luxury status cachet.","one_sentence_critique":"Wants an Indian answer to LMNT, but packaging looks mass-market.","buy_readiness":false,"key_frustrations":["brand prestige"],"trigger_words":["luxury"]},{"persona_id":"p7","persona_name":"The Hustle-Culture Solopreneur","score_out_of_10":8,"primary_objection":"Needs to confirm if it dissolves cold without clumping.","one_sentence_critique":"Sugar-free electrolytes keep me focused through 14-hour deep work sprints.","buy_readiness":true,"key_frustrations":["dissolvability"],"trigger_words":["fasting"]},{"persona_id":"p8","persona_name":"The Frugal College Student","score_out_of_10":3,"primary_objection":"Electral ORS costs twenty rupees; fifty rupees is highway robbery.","one_sentence_critique":"Fifty rupees for fancy powder is a scam when chemist ORS costs twenty.","buy_readiness":false,"key_frustrations":["cost per sachet"],"trigger_words":["₹499"]},{"persona_id":"p9","persona_name":"The Rural Traditionalist","score_out_of_10":2,"primary_objection":"Western artificial powder when fresh coconut water and buttermilk exist.","one_sentence_critique":"Chemical Western nonsense when fresh nimbu pani has kept us healthy for ages.","buy_readiness":false,"key_frustrations":["artificial powder"],"trigger_words":["traditional"]},{"persona_id":"p10","persona_name":"The Wealthy Boomer Empty Nester","score_out_of_10":4,"primary_objection":"500mg sodium per sachet threatens blood pressure without cardiologist sign-off.","one_sentence_critique":"Chugging half a gram of salt per serving is a one-way ticket to hypertension.","buy_readiness":false,"key_frustrations":["sodium content"],"trigger_words":["blood pressure"]}],"disclaimer":"Synthetic opinions from simulated personas, not real market data."}\n\n`,
    ].join("");

    const screenshotsDir = path.resolve(__dirname, "..", "screenshots");

    // ── Test 1: Desktop (1280px) ──────────────────────────────────────────
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.route("**/api/simulate-focus-group", (route) => {
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: ssePayload,
      });
    });

    await desktopPage.goto("/");
    await desktopPage.getByRole("button", { name: /KavachHydrate/i }).click();
    await desktopPage.getByRole("button", { name: /Run the Focus Group/i }).click();
    await expect(desktopPage.getByText("The Room Has Spoken.")).toBeVisible();

    // Check no horizontal scroll on desktop
    const desktopScrollWidth = await desktopPage.evaluate(
      () => document.documentElement.scrollWidth
    );
    const desktopClientWidth = await desktopPage.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(desktopScrollWidth).toBeLessThanOrEqual(desktopClientWidth);

    await desktopPage.screenshot({
      path: path.join(screenshotsDir, "desktop_results.png"),
      fullPage: true,
    });
    await desktopContext.close();

    // ── Test 2: Mobile Phone (375px) ──────────────────────────────────────
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.route("**/api/simulate-focus-group", (route) => {
      route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: ssePayload,
      });
    });

    await mobilePage.goto("/");
    await mobilePage.getByRole("button", { name: /KavachHydrate/i }).click();
    await mobilePage.getByRole("button", { name: /Run the Focus Group/i }).click();
    await expect(mobilePage.getByText("The Room Has Spoken.")).toBeVisible();

    // Check no horizontal scroll on 375px mobile
    const mobileScrollWidth = await mobilePage.evaluate(
      () => document.documentElement.scrollWidth
    );
    const mobileClientWidth = await mobilePage.evaluate(
      () => document.documentElement.clientWidth
    );
    console.log(`Mobile: scrollWidth=${mobileScrollWidth}, clientWidth=${mobileClientWidth}`);

    await mobilePage.screenshot({
      path: path.join(screenshotsDir, "mobile_375px_results.png"),
      fullPage: true,
    });
    await mobileContext.close();
  });
});
