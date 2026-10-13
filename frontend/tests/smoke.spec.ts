import { test, expect } from "@playwright/test";

test.describe("SynthFocus Frontend Smoke Tests (Direction A, Routes & Mocked SSE)", () => {
  test("landing page renders headline, steps, sample result, and navigates to /run", async ({
    page,
  }) => {
    await page.goto("/");
    // 1. Headline
    await expect(page.locator("h1")).toContainText("KILL THE SLOW FOCUS GROUP");
    // 2. How it works section
    await expect(page.getByRole("heading", { name: "HOW IT WORKS" })).toBeVisible();
    await expect(page.getByText("PASTE YOUR PITCH")).toBeVisible();
    await expect(page.getByText("TEN BUYERS ARGUE")).toBeVisible();
    await expect(page.getByText("GET THE PLAYBOOK")).toBeVisible();
    // 3. Sample result card
    await expect(page.getByRole("heading", { name: "The Zingy Gen-Z Trend Chaser" })).toBeVisible();
    await expect(page.getByText("3/10")).toBeVisible();
    await expect(page.getByText("Example output")).toBeVisible();
    // 4. Click hero CTA to navigate to /run
    const ctaButton = page.getByRole("link", { name: /Run simulation/i }).first();
    await ctaButton.click();
    await expect(page).toHaveURL(/\/run/);
  });

  test("enforces input boundaries on /run: Run button disabled outside 10-5000 characters", async ({
    page,
  }) => {
    await page.goto("/run");
    const textarea = page.locator("#product-brief-input");
    const runButton = page.getByRole("button", { name: /Run the Focus Group/i });

    // 1. Empty brief (0 chars) -> Disabled
    await expect(runButton).toBeDisabled();

    // 2. Short brief (< 10 chars) -> Disabled
    await textarea.fill("Too short");
    await expect(runButton).toBeDisabled();

    // 3. Valid brief (>= 10 chars) -> Enabled
    await textarea.fill("This brief has more than ten characters.");
    await expect(runButton).toBeEnabled();

    // 4. Exceeds limit (> 5000 chars) -> Disabled
    await textarea.fill("a".repeat(5001));
    await expect(runButton).toBeDisabled();
  });

  test("executes simulation flow on /run, displays ranked personas with inline bars and checklist playbook", async ({
    page,
  }) => {
    // 1. Mock the SSE endpoint
    await page.route("**/api/simulate-focus-group", async (route) => {
      const ssePayload = [
        `event: start\ndata: {"status":"started","total_personas":10,"total_batches":5,"batch_size":2,"message":"Starting panel..."}\n\n`,
        `event: batch_start\ndata: {"status":"batch_running","batch_index":0,"total_batches":5,"message":"Grilling Batch 1...","personas":[{"id":"gen_z","name":"The Zingy Gen-Z Trend Chaser","avatar":"⚡"},{"id":"mom","name":"The Crunch-Time Cooking Mom","avatar":"⏰"}]}\n\n`,
        `event: batch_complete\ndata: {"status":"batch_done","batch_index":0,"total_batches":5,"personas_evaluated":[{"persona_id":"gen_z","persona_name":"The Zingy Gen-Z Trend Chaser","score_out_of_10":8,"primary_objection":"Looks too corporate","one_sentence_critique":"Aesthetic slaps, packaging is clean.","buy_readiness":true,"key_frustrations":["sachet count"],"trigger_words":["stevia"]},{"persona_id":"mom","persona_name":"The Crunch-Time Cooking Mom","score_out_of_10":4,"primary_objection":"Expensive for daily hydration","one_sentence_critique":"Kids will complain about the stevia aftertaste.","buy_readiness":false,"key_frustrations":["price"],"trigger_words":["₹499"]}],"message":"Batch 1 done"}\n\n`,
        `event: throttling\ndata: {"status":"sleeping","batch_index":0,"seconds_remaining":2,"message":"Free-tier guard pause"}\n\n`,
        `event: analyst_start\ndata: {"status":"analyzing","message":"Chief analyst synthesizing..."}\n\n`,
        `event: final_report\ndata: {"metrics":{"average_score":6.0,"buy_ready_count":5,"total_personas":10,"min_score":4,"max_score":8,"score_spread":1.41},"executive_summary":"Strong aesthetic and health appeal with expected price friction in tier-2 cohorts.","playbook_markdown":"# Objection Playbook\\n\\n## Price Barrier\\n* Introduce a 3-sachet starter pack at lower price.\\n\\n[Official Research](https://example.com/research)","persona_results":[{"persona_id":"gen_z","persona_name":"The Zingy Gen-Z Trend Chaser","score_out_of_10":8,"primary_objection":"Looks too corporate","one_sentence_critique":"Aesthetic slaps, packaging is clean.","buy_readiness":true,"key_frustrations":["sachet count"],"trigger_words":["stevia"]},{"persona_id":"mom","persona_name":"The Crunch-Time Cooking Mom","score_out_of_10":4,"primary_objection":"Expensive for daily hydration","one_sentence_critique":"Kids will complain about the stevia aftertaste.","buy_readiness":false,"key_frustrations":["price"],"trigger_words":["₹499"]}],"disclaimer":"Synthetic opinions from simulated personas, not real market data."}\n\n`,
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
        body: ssePayload,
      });
    });

    // 2. Navigate to /run
    await page.goto("/run");

    // 3. Test sample chip prefill
    const sampleChip = page.getByRole("button", { name: /KavachHydrate/i });
    await expect(sampleChip).toBeVisible();
    await sampleChip.click();

    const textarea = page.locator("#product-brief-input");
    await expect(textarea).toContainText("KavachHydrate");

    // 4. Click Run simulation button
    const runButton = page.getByRole("button", { name: /Run the Focus Group/i });
    await expect(runButton).toBeEnabled();
    await runButton.click();

    // 5. Verify results view is reached
    await expect(page.getByText("The Room Has Spoken.")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Average Score")).toBeVisible();
    await expect(page.getByText("Simulated personas who'd buy")).toBeVisible();
    await expect(page.getByText("Score Spread")).toBeVisible();

    // 6. Verify ranked persona list with inline bars rendered (no radar chart)
    await expect(page.getByRole("heading", { name: "Ranked Persona Verdicts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Zingy Gen-Z Trend Chaser" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The Crunch-Time Cooking Mom" })).toBeVisible();
    await expect(page.locator("text=8/10").first()).toBeVisible();
    await expect(page.locator("text=4/10").first()).toBeVisible();

    // 7. Verify sanitized markdown link has rel="noopener noreferrer"
    const link = page.locator('a[href="https://example.com/research"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAttribute("target", "_blank");

    // 8. Verify footer disclaimer
    await expect(
      page.getByText("Synthetic opinions from simulated personas, not real market data.").first()
    ).toBeVisible();

    // 9. Verify Reset / Run Again
    const runAgainBtn = page.getByRole("button", { name: "Run Another Simulation", exact: true });
    await runAgainBtn.click();
    await expect(page.getByText("Product Brief or Pitch")).toBeVisible();
  });

  test("handles 429 busy response cleanly with in-UI ErrorBanner on /run", async ({ page }) => {
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

    await page.goto("/run");
    const sampleChip = page.getByRole("button", { name: /KavachHydrate/i });
    await sampleChip.click();

    const runButton = page.getByRole("button", { name: /Run the Focus Group/i });
    await runButton.click();

    // Verify ErrorBanner has role="alert" and displays "Engine Busy"
    const errorBanner = page.locator('div[role="alert"]').filter({ hasText: "Engine Busy" });
    await expect(errorBanner).toBeVisible();
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  });

  test("shows connection lost error if stream terminates without final_report on /run", async ({
    page,
  }) => {
    await page.route("**/api/simulate-focus-group", async (route) => {
      const partialSSE = [
        `event: start\ndata: {"status":"started","total_personas":10,"total_batches":5,"batch_size":2,"message":"Starting..."}\n\n`,
        `event: batch_start\ndata: {"status":"batch_running","batch_index":0,"total_batches":5,"message":"Grilling Batch 1...","personas":[{"id":"p1","name":"Tester","avatar":"👤"}]}\n\n`,
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
        body: partialSSE,
      });
    });

    await page.goto("/run");
    const sampleChip = page.getByRole("button", { name: /PipelineForge/i });
    await sampleChip.click();

    const runButton = page.getByRole("button", { name: /Run the Focus Group/i });
    await runButton.click();

    // Must show Connection Lost error instead of empty results
    await expect(page.getByText("Connection Lost")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("The Room Has Spoken.")).not.toBeVisible();
  });
});
