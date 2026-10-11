import { test } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/ishaa/.gemini/antigravity/brain/7fa2091a-8893-40fb-a1d3-3c1e2df418cb";

const MOCK_10_PERSONAS_RESULTS = {
  metrics: {
    average_score: 4.8,
    buy_ready_count: 3,
    total_personas: 10,
    min_score: 2,
    max_score: 8,
    score_spread: 2.21,
  },
  executive_summary:
    "KavachHydrate demonstrates distinct polarization. Biohackers and holistic wellness consumers value the clean stevia and fasting utility, whereas price-sensitive college students, traditionalists, and desk workers cite steep pricing and lack of clinical electrolyte certification as blockers.",
  playbook_markdown: `## 🎯 Pricing & Sachet Architecture
* [✓] **Introduce a 3-sachet starter pack at ₹149**: Lower the discovery barrier for students and skeptical first-timers currently anchored to ₹22 ORS.
* [✓] **Highlight unit economics vs. bottled coconut water**: Frame ₹49.9/sachet as savings against daily ₹60–₹80 fresh tender coconut water.

## 🛡️ Trust & Health Claims
* [✓] **Clarify exact osmolarity and sodium-potassium ratio** *(needs validation)*: Satisfy analytical desk workers and corporate managers requiring clinical proof over lifestyle copy.
* [✓] **Prominently label hypertension considerations** *(needs validation)*: Reassure older consumers managing blood pressure that 500mg sodium per sachet complies with daily allowance.

## ⚡ Positioning & Packaging Aesthetics
* [✓] **De-medicalize outer pouch, elevate individual sachet aesthetics**: Shift away from hospital supplement aesthetics to appeal to aesthetic-first Gen-Z buyers without alienating family buyers.

[Official Formulation Reference](https://example.com/hydration-research)`,
  persona_results: [
    {
      persona_id: "hustle_culture_solopreneur",
      persona_name: "The Hustle-Culture Solopreneur",
      score_out_of_10: 8,
      primary_objection: "Needs instant solubility proof in standard shaker bottles without clumping.",
      one_sentence_critique: "Zero insulin spike during my 16-hour fasting window; definitely adding this to my morning protocol.",
      buy_readiness: true,
      key_frustrations: ["dissolvability in cold water"],
      trigger_words: ["sugar-free", "fasting"],
    },
    {
      persona_id: "holistic_wellness_yogi",
      persona_name: "The Holistic Wellness Yogi",
      score_out_of_10: 8,
      primary_objection: "Ensure the paper sachet inner lining doesn't contain hidden microplastic films.",
      one_sentence_critique: "Organic stevia leaf over chemical sucralose is a major win for gut microbiome integrity.",
      buy_readiness: true,
      key_frustrations: ["sachet waste", "artificial flavoring"],
      trigger_words: ["organic stevia", "recyclable paper"],
    },
    {
      persona_id: "high_income_dink",
      persona_name: "The High-Income DINK",
      score_out_of_10: 7,
      primary_objection: "The raw mango flavour risks feeling too synthetic compared to artisanal cold-pressed juices.",
      one_sentence_critique: "Solid alternative to importing LMNT or Liquid I.V. if the branding looks high-end on the counter.",
      buy_readiness: true,
      key_frustrations: ["flavour sophistication", "packaging luxury"],
      trigger_words: ["₹499", "lemon-mint"],
    },
    {
      persona_id: "crunch_time_mom",
      persona_name: "The Crunch-Time Cooking Mom",
      score_out_of_10: 5,
      primary_objection: "Kids will reject the subtle stevia aftertaste after playing outside in 40°C heat.",
      one_sentence_critique: "Love the lack of artificial food dyes, but ₹50 a day per kid adds up way too fast on the grocery budget.",
      buy_readiness: false,
      key_frustrations: ["daily household expense", "kid taste acceptance"],
      trigger_words: ["stevia", "₹499"],
    },
    {
      persona_id: "skeptical_corporate_millennial",
      persona_name: "The Skeptical Corporate Millennial",
      score_out_of_10: 5,
      primary_objection: "Where is the clinical osmolarity data proving this hydrates faster than basic desk water?",
      one_sentence_critique: "Clean ingredients, but give me third-party lab verification before I replace my afternoon espresso.",
      buy_readiness: false,
      key_frustrations: ["unsubstantiated claims", "osmolarity specs"],
      trigger_words: ["electrolytes", "sugar-free"],
    },
    {
      persona_id: "tech_bro_developer",
      persona_name: "The Tech-Bro Developer",
      score_out_of_10: 4,
      primary_objection: "Massive gross margin markup on 700mg of basic mineral salts and citric acid.",
      one_sentence_critique: "I can bulk-mix food-grade sodium chloride and potassium citrate for 5% of this price point.",
      buy_readiness: false,
      key_frustrations: ["BOM markup", "subscription lock-in"],
      trigger_words: ["₹49.9 each"],
    },
    {
      persona_id: "gen_z_trend_chaser",
      persona_name: "The Zingy Gen-Z Trend Chaser",
      score_out_of_10: 3,
      primary_objection: "The branding sounds lowkey like a boring pharmaceutical supplement for desk workers instead of an aesthetic TikTok drop.",
      one_sentence_critique: "This whole vibe is giving corporate wellness and completely lacks the drip needed for my IG story.",
      buy_readiness: false,
      key_frustrations: ["medicinal aesthetic", "uninspiring pouch"],
      trigger_words: ["desk workers", "sachets"],
    },
    {
      persona_id: "frugal_college_student",
      persona_name: "The Frugal College Student",
      score_out_of_10: 3,
      primary_objection: "Pharmacy Electral ORS costs ₹22; ₹50 per sachet is completely unaffordable on a mess budget.",
      one_sentence_critique: "Way too bougie for college kids when generic pharmacy sachets do the exact same hydration job.",
      buy_readiness: false,
      key_frustrations: ["price per serving", "no student pack"],
      trigger_words: ["₹499", "premium"],
    },
    {
      persona_id: "wealthy_boomer_empty_nester",
      persona_name: "The Wealthy Boomer Empty Nester",
      score_out_of_10: 3,
      primary_objection: "500mg sodium per serving triggers hypertension concerns without a doctor's endorsement.",
      one_sentence_critique: "Appreciate the sugar-free formulation for pre-diabetes, but terrified the salt content will spike blood pressure.",
      buy_readiness: false,
      key_frustrations: ["hypertension risk", "lack of doctor endorsement"],
      trigger_words: ["500 mg sodium"],
    },
    {
      persona_id: "rural_traditionalist",
      persona_name: "The Rural Traditionalist",
      score_out_of_10: 2,
      primary_objection: "Traditional homemade nimbu-pani with rock salt and buttermilk is fresher, cheaper, and proven for generations.",
      one_sentence_critique: "Packaged chemical powder trying to reinvent basic salt water with fancy English buzzwords.",
      buy_readiness: false,
      key_frustrations: ["artificial gimmick", "Western health fads"],
      trigger_words: ["electrolyte powder"],
    },
  ],
  disclaimer: "Synthetic opinions from simulated personas, not real market data.",
};

test.describe("Visual Captures for Direction A", () => {
  const viewports = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile_375px", width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    test(`1. Landing Page - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("http://localhost:3000/");
      await page.waitForLoadState("networkidle");
      // Scroll to trigger IntersectionObservers on all sections
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `landing_${vp.name}.png`),
        fullPage: true,
      });
    });

    test(`2. Run Input Screen - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("http://localhost:3000/run");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `run_input_${vp.name}.png`),
        fullPage: true,
      });
    });

    test(`3. Run Mid-Throttle Processing - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.addInitScript(() => {
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
          if (typeof url === "string" && url.includes("/api/simulate-focus-group")) {
            const encoder = new TextEncoder();
            const sseChunks = [
              `event: start\ndata: {"status":"started","total_personas":10,"total_batches":5,"batch_size":2,"message":"Initialized panel of 10 synthetic buyer personas."}\n\n`,
              `event: batch_start\ndata: {"status":"batch_running","batch_index":0,"total_batches":5,"message":"Grilling Batch 1...","personas":[{"id":"hustle","name":"The Hustle-Culture Solopreneur","avatar":"🚀"},{"id":"yogi","name":"The Holistic Wellness Yogi","avatar":"🌿"}]}\n\n`,
              `event: batch_complete\ndata: {"status":"batch_done","batch_index":0,"total_batches":5,"personas_evaluated":[{"persona_id":"hustle","persona_name":"The Hustle-Culture Solopreneur","score_out_of_10":8,"primary_objection":"Needs instant cold water solubility.","one_sentence_critique":"Zero insulin spike during fasting window.","buy_readiness":true,"key_frustrations":["cold clumping"],"trigger_words":["fasting"]},{"persona_id":"yogi","persona_name":"The Holistic Wellness Yogi","score_out_of_10":8,"primary_objection":"Check paper sachet liner for microplastics.","one_sentence_critique":"Organic stevia over sucralose protects the gut microbiome.","buy_readiness":true,"key_frustrations":["sachet waste"],"trigger_words":["organic stevia"]}],"message":"Batch 1 done"}\n\n`,
              `event: throttling\ndata: {"status":"sleeping","batch_index":0,"seconds_remaining":12,"message":"Free-tier guard pause"}\n\n`,
            ].join("");

            const stream = new ReadableStream({
              start(controller) {
                controller.enqueue(encoder.encode(sseChunks));
                // Keep stream open during screenshot
              },
            });

            return new Response(stream, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
              },
            });
          }
          return originalFetch(url, options);
        };
      });

      await page.goto("http://localhost:3000/run");
      const sampleChip = page.getByRole("button", { name: /KavachHydrate/i });
      await sampleChip.click();
      const runButton = page.getByRole("button", { name: /Run the Focus Group/i });
      await runButton.click();

      // Wait until throttling message is visible
      await page.getByText("Rate guard pause").first().waitFor({ timeout: 5000 });
      await page.waitForTimeout(600);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `run_processing_${vp.name}.png`),
        fullPage: true,
      });
    });

    test(`4. Run Results Screen - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.route("**/api/simulate-focus-group", async (route) => {
        const sseEvents = [
          `event: start\ndata: {"status":"started","total_personas":10,"total_batches":5,"batch_size":2,"message":"Starting..."}\n\n`,
          `event: final_report\ndata: ${JSON.stringify(MOCK_10_PERSONAS_RESULTS)}\n\n`,
        ].join("");

        await route.fulfill({
          status: 200,
          contentType: "text/event-stream",
          headers: {
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
          },
          body: sseEvents,
        });
      });

      await page.goto("http://localhost:3000/run");
      const sampleChip = page.getByRole("button", { name: /KavachHydrate/i });
      await sampleChip.click();
      const runButton = page.getByRole("button", { name: /Run the Focus Group/i });
      await runButton.click();

      await page.getByText("The Room Has Spoken.").waitFor({ timeout: 8000 });
      // Allow inline score bars animations to complete
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `run_results_${vp.name}.png`),
        fullPage: true,
      });
    });

    test(`5. Run 429 Busy State - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.route("**/api/simulate-focus-group", async (route) => {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
          },
          body: JSON.stringify({
            code: "busy",
            detail: "Simulation engine is currently busy running another focus group.",
          }),
        });
      });

      await page.goto("http://localhost:3000/run");
      const sampleChip = page.getByRole("button", { name: /KavachHydrate/i });
      await sampleChip.click();
      const runButton = page.getByRole("button", { name: /Run the Focus Group/i });
      await runButton.click();

      await page.getByText("Engine Busy").waitFor({ timeout: 5000 });
      await page.waitForTimeout(400);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `run_busy_429_${vp.name}.png`),
        fullPage: true,
      });
    });
  }
});
