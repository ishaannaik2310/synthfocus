/**
 * Central copy repository for SynthFocus.
 * Voice rules:
 * - Challenger energy on landing page and results headings.
 * - Plain, direct, unambiguous voice in errors and footer.
 * - Truth rules: no invented testimonials, user counts, logos, fake stats.
 * - Never imply results are real market predictions.
 * - Says "about 70 seconds" per run.
 */

export const COPY = {
  // ── APP NAV ───────────────────────────────────────────────────────────────
  nav: {
    brand: "SYNTHFOCUS",
    tagline: "Simulated Buyer Engine",
    badge: "Free Tier Mode",
    howItWorks: "How it works",
    example: "See an example",
    runSimulation: "Run simulation",
  },

  // ── LANDING HERO ──────────────────────────────────────────────────────────
  hero: {
    headline: "Kill the slow focus group.",
    subhead: "Ten simulated buyers, about 70 seconds per run.",
    ctaButton: "Run simulation",
    disclaimer: "Simulated buyers for stress-testing a pitch, not real consumers.",
  },

  // ── FACT STRIP (Drama moment with verified real facts) ─────────────────────
  factStrip: [
    { value: "10", label: "Simulated buyers", detail: "Different budgets, habits and biases" },
    { value: "~70s", label: "Fast turnaround", detail: "From pitch to playbook" },
    { value: "01", label: "Actionable playbook", detail: "Ranked fixes for your pitch" },
  ],

  // ── HOW IT WORKS ──────────────────────────────────────────────────────────
  howItWorks: {
    title: "HOW IT WORKS",
    subtitle: "Three steps. Ten skeptical personas. About 70 seconds per run.",
    steps: [
      {
        numeral: "01",
        title: "PASTE YOUR PITCH",
        description: "Drop in your product brief, pricing and claims.",
      },
      {
        numeral: "02",
        title: "TEN BUYERS ARGUE",
        description: "Ten distinct simulated personas grill your offer from their cynical perspectives.",
      },
      {
        numeral: "03",
        title: "GET THE PLAYBOOK",
        description: "Receive ranked scores, dealbreaker objections, and prioritized messaging fixes.",
      },
    ],
  },

  // ── SAMPLE RESULT (KavachHydrate Run) ─────────────────────────────────────
  sampleResult: {
    title: "UNFILTERED CRITIQUE",
    subtitle: "Real output from a run. Clearly labeled example.",
    cardLabel: "Example output",
    productTag: "KavachHydrate (Electrolyte Powder)",
    personaName: "The Zingy Gen-Z Trend Chaser",
    category: "Trend & Aesthetics · 19 y/o",
    score: 3,
    scoreOutOfTen: "3/10",
    scorePercentage: "30%",
    hotTake:
      "This whole vibe is giving corporate wellness and completely lacks the drip needed for my IG story.",
    primaryObjection:
      "The branding sounds lowkey like a boring pharmaceutical supplement for desk workers instead of an aesthetic TikTok drop.",
  },

  // ── FINAL CTA ─────────────────────────────────────────────────────────────
  finalCta: {
    title: "STOP GUESSING. GRILL YOUR PITCH.",
    subtitle: "Ten simulated buyers. Instant objection playbook. About 70 seconds per run.",
    ctaButton: "Run simulation",
    disclaimer: "Simulated buyers for stress-testing a pitch, not real consumers.",
  },

  // ── FOOTER (PRD mandated verbatim disclaimer) ─────────────────────────────
  footer: {
    brand: "SYNTHFOCUS",
    disclaimer: "Synthetic opinions from simulated personas, not real market data.",
    secondaryNote: "Simulated buyers for stress-testing a pitch, not real consumers.",
    navLinks: [
      { label: "Run Simulation", href: "/run" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "See an example", href: "/#example" },
    ],
  },

  // ── TOOL /RUN INPUT ───────────────────────────────────────────────────────
  input: {
    title: "Product Brief or Pitch",
    subtitle: "Paste your landing page copy, value proposition, or launch brief (10 to 5,000 characters).",
    label: "Product Brief",
    placeholder: "Paste your landing page copy, product pitch, or value proposition (10 to 5,000 characters)…",
    minCharsNotice: "Min 10 characters",
    charCount: (current: number, max: number) => `${current.toLocaleString()} / ${max.toLocaleString()}`,
    runButton: "Run the Focus Group",
    cancelButton: "Cancel Simulation",
    runningButton: "Simulating Focus Group…",
  },

  // ── SAMPLE CHIPS (Invented brand names only) ──────────────────────────────
  sampleChips: [
    {
      label: "KavachHydrate (Electrolyte)",
      brief:
        "KavachHydrate: sugar-free electrolyte powder, 10 sachets for ₹499 (₹49.9 each). Sweetened with organic stevia leaf extract, no artificial colours, 500 mg sodium and 200 mg potassium per sachet. Flavours: lemon-mint and raw mango. 100% recyclable paper sachets. Targeted at city gym-goers and desk workers in Indian metros.",
    },
    {
      label: "PipelineForge (B2B AI Sales)",
      brief:
        "PipelineForge: an AI sales outbound agent that researches prospect websites, drafts context-aware multi-touch email sequences, and auto-schedules demos. Native two-way sync with HubSpot and Salesforce in 5 minutes. Billed at $89/seat/month. Built for lean B2B growth teams looking to scale qualified meetings without SDR headcount bloat.",
    },
    {
      label: "HearthCrumbs (Sourdough Club)",
      brief:
        "HearthCrumbs: weekly artisanal sourdough subscription delivering two freshly baked, hand-scored loaves to your doorstep every Friday morning. Baked with heirloom stoneground grains, wild starter, and 48-hour slow cold fermentation with zero commercial yeast. £16 per week, pause or cancel anytime.",
    },
  ],

  // ── TICKER / TELEMETRY ───────────────────────────────────────────────────
  ticker: {
    onStart: (total: number, batches: number) =>
      `Initialized panel of ${total} synthetic buyer personas. Spawning ${batches} micro-batches…`,
    onBatchStart: (current: number, total: number, names: string) =>
      `Batch ${current}/${total}: Grilling ${names}…`,
    onBatchComplete: (current: number, total: number) =>
      `Batch ${current}/${total}: Verdicts recorded.`,
    onThrottle: (seconds: number, nextBatch: number, totalBatches: number) =>
      `Rate guard pause (${seconds}s) before Batch ${nextBatch}/${totalBatches} to preserve zero-cost API quotas.`,
    onThrottleCountdown: (s: number, nextBatch: number) =>
      `Resuming Batch ${nextBatch} in ${s}s…`,
    onAnalystStart:
      "All 10 personas evaluated. Chief Analyst synthesizing objection playbook and quantitative metrics…",
  },

  // ── PROCESSING STATES ─────────────────────────────────────────────────────
  processing: {
    batchProgressLabel: (current: number, total: number) => `Batch ${current} of ${total}`,
    analystSynthesizingTitle: "Chief Analyst Synthesizing",
    analystSynthesizingSubtitle:
      "Synthesizing persona friction, scoring spread, and objection-handling playbook…",
  },

  // ── RESULTS ───────────────────────────────────────────────────────────────
  results: {
    heading: "The Room Has Spoken.",
    subheading: "Ranked persona verdicts, primary friction points, and actionable playbook.",
    kpi: {
      averageScore: "Average Score",
      averageScoreSub: "Mean score out of 10",
      buyReadyCount: "Simulated personas who'd buy",
      buyReadySuffix: (total: number) => `/ ${total}`,
      buyReadySub: "Personas the simulation marked as likely buyers",
      scoreSpread: "Score Spread",
      scoreSpreadSub: "Standard deviation (σ)",
    },
    radarHeading: "Persona Score Distribution",
    gridHeading: "Ranked Persona Verdicts",
    rankedHeading: "Ranked Persona Verdicts",
    playbookHeading: "Objection Playbook",
    playbookIntro:
      "Synthesized counter-arguments and messaging refinements. Claims requiring clinical proof or third-party validation are marked 'if true' / 'needs validation'.",
    runAgainButton: "Run Another Simulation",
    copyPlaybookButton: "Copy Playbook",
    playbookCopied: "Copied to clipboard!",
  },

  // ── PERSONA CARD ──────────────────────────────────────────────────────────
  personaCard: {
    scoreOutOfTen: (score: number) => `${score}/10`,
    buyReadyTrue: "Simulated Buy-Ready",
    buyReadyFalse: "Skeptical",
    objectionLabel: "Primary Objection",
    critiqueLabel: "Hot Take",
    triggerWordsLabel: "Trigger Words",
    frustrationsLabel: "Key Frustrations",
    expandText: "Show more",
    collapseText: "Show less",
  },

  // ── ERRORS (Plain, neutral voice) ─────────────────────────────────────────
  errors: {
    busy: {
      title: "Engine Busy",
      message:
        "The simulation engine is currently processing another focus group. To stay within free-tier rate limits, SynthFocus runs one focus group at a time. Please wait approximately 60–90 seconds and try again.",
      retryButton: "Try Again",
    },
    busyAfterCancel: {
      title: "Wrapping Up",
      message: "Wrapping up the last run. Try again in a few seconds.",
      retryButton: "Try Again",
    },
    dailyCap: {
      title: "Daily Limit Reached",
      message:
        "The global daily simulation quota has been reached to protect the Gemini API daily ceiling. Quotas reset daily at 00:00 UTC (the next UTC calendar day boundary).",
      retryButton: "Try Again Later",
    },
    rateLimit: {
      title: "Hourly Rate Limit Exceeded",
      message:
        "You have reached the maximum number of simulation runs allowed per hour. Please take a break and try again later.",
      retryButton: "Try Again Later",
    },
    network: {
      title: "Connection Failed",
      message:
        "Could not connect to the SynthFocus backend server. Ensure the server is running on the configured API URL and check your network connection.",
      retryButton: "Retry",
    },
    disconnect: {
      title: "Connection Lost",
      message:
        "The simulation stream was interrupted before completion. No final report was received.",
      retryButton: "Run Again",
    },
    unknown: {
      title: "Simulation Error",
      message: "An unexpected error occurred during the simulation run.",
      retryButton: "Try Again",
    },
  },
} as const;
