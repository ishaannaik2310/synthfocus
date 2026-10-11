# SynthFocus — Product Context

## What it is
SynthFocus is a synthetic AI focus group simulator. Founders and marketers paste
a product pitch or landing-page copy and get back a panel of 10 simulated consumer
personas who score, critique, and object to the pitch in real time — complete with
an analyst-synthesized objection-handling playbook.

## Who uses it
Primary: Founders stress-testing a pitch before a fundraise or launch.
Secondary: Growth marketers pressure-testing landing page copy before ad spend.
Audience mindset: fast, competitive, no time for week-long agency research cycles.

## Tone & Voice
Fast, aggressive, challenger energy. Treats slow traditional market research as
the incumbent and SynthFocus as the disruptor. Short punchy sentences, strong
verbs, momentum, urgency, credible confidence. Voice lives in the hero, ticker
lines, results headings, and playbook intro. Stops at error messages and footer —
those must be plain, clear, and actionable.

## Anti-goals
- No generic AI-dashboard look (gradient cards, spinners, filler charts).
- No fake-precision metrics (no NPS, no "94.7% confidence intervals").
- No invented social proof: no testimonials, user counts, logos, "as seen in".
- No implied reality: results are synthetic simulations, not market predictions.
- No countdown timers, artificial scarcity, or "only 3 runs left" mechanics.
- No price claims for human focus groups beyond "weeks and thousands".
- Dense mission-control layout, not an oversized marketing hero section.

## Technical constraints
Stateless, no auth, no DB. Backend is FastAPI + LangGraph on Gemini free tier.
Throttled: 5 batches of 2 personas, ~13s sleep between batches = ~70s total.
One simulation runs at a time (global semaphore). 120 runs/day cap.
