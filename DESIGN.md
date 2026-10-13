# DESIGN.md — SynthFocus Direction A (Kinetic Cobalt) Design System

This document specifies the visual tokens, typography, component behaviors, and layout rules extracted from Direction A ("Kinetic Cobalt") for SynthFocus. All frontend components adhere strictly to these tokens.

---

## 1. Core Palette & Surfaces

| Token | Hex / Value | Role | Usage |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#133EE8` | Primary Canvas | Saturated cobalt blue background across all full-bleed pages. |
| `--color-canvas-deep` | `#0E2CB3` | Deep Canvas | Darker cobalt for section contrast and recessed panels. |
| `--color-canvas-subtle` | `#1946F0` | Elevated Canvas | Elevated interactive surfaces on cobalt. |
| `--color-surface-card` | `#FFFFFF` | Primary Card Surface | Crisp, stark white card surface for evaluation cards. |
| `--color-surface-card-subtle` | `#F8F9FC` | Card Sub-surface | Very light gray for headers or metadata strips inside cards. |
| `--color-surface-translucent` | `rgba(255, 255, 255, 0.08)` | Translucent Glass | Translucent panels on cobalt for secondary data blocks. |
| `--color-accent-yellow` | `#FFE500` | Primary CTA Accent | Flat, solid lemon yellow for all primary action buttons and score bars. |
| `--color-accent-yellow-hover` | `#F0D800` | CTA Hover | Pressed / active state for yellow CTA. |
| `--color-on-accent-yellow` | `#000000` | CTA Text Ink | Stark black text on yellow buttons and badges. |
| `--color-ink` | `#FFFFFF` | Primary Ink | Clean chalk white for headlines, body copy on cobalt canvas. |
| `--color-ink-muted` | `#DCE4FF` | Secondary Ink | Translucent blue-white for subheadlines and supporting copy. |
| `--color-ink-subtle` | `#A5B4FC` | Micro Ink | Subtle label text and eyebrow headers. |
| `--color-ink-dark` | `#0A0A0A` | Dark Ink | Deep charcoal/black text on white cards or yellow badges. |
| `--color-ink-dark-muted` | `#4B5563` | Dark Muted Ink | Secondary text inside white evaluation cards. |
| `--color-hairline` | `rgba(255, 255, 255, 0.15)` | Subtle Grid Line | Vertical and horizontal structural coordinate rules. |
| `--color-hairline-strong` | `rgba(255, 255, 255, 0.28)` | Divider Line | Dividers and borders on cobalt surfaces. |

### Persona 3D Sculpture Palette Accents
- **Terracotta / Rust:** `#D95D39`
- **Pastel Pink / Coral:** `#F2A1B8`
- **Stone White:** `#F0F0F0`
- **Electric Yellow:** `#FFE500`
- **Deep Cobalt:** `#0E2CB3`

---

## 2. Typography

SynthFocus pairs an ultra-bold condensed sans-serif for display headlines with clean geometric grotesque for body and monospace for telemetry metadata.

- **Headline Display (Condensed Uppercase):**
  - Font: `-apple-system, BlinkMacSystemFont, "Impact", "Arial Narrow Bold", sans-serif`
  - Style: Uppercase, condensed tracking (`-0.02em` to `-0.03em`), line height `0.95` to `1.05`.
  - Sizes:
    - Desktop Hero: `clamp(48px, 6vw, 84px)`
    - Section Titles: `clamp(36px, 4.5vw, 64px)`
    - Results Headline: `clamp(32px, 4vw, 56px)`
- **Eyebrow / Category Headers:**
  - Tracked uppercase, letter-spacing `0.18em` to `0.25em`, font-weight `700`, size `11px` to `13px`.
- **Body & Paragraphs:**
  - Font: `var(--font-inter, sans-serif)`
  - Regular weight `400` / Medium `500`, line height `1.5`, size `15px` to `17px`.
- **Technical & Monospace (Telemetry, Timers, Disclaimers):**
  - Font: `var(--font-mono, "JetBrains Mono", monospace)`
  - Size `12px` to `14px`, tabular numbers (`font-variant-numeric: tabular-nums`).

---

## 3. Layout & Structure

- **No Cards-Inside-Cards:** Containers must not be arbitrarily nested inside other bordered boxes. Maintain flat, open layouts.
- **Section Rhythm:**
  - Sections breathe with generous vertical padding (`py-20` to `py-28` on desktop, `py-14` on mobile).
  - Faint vertical structural coordinate lines (`rgba(255, 255, 255, 0.08)`) create an architectural baseline grid.
- **Mobile First / Responsive (375px to 1440px):**
  - All headlines wrap naturally without clipping or overflowing.
  - Multi-column grids (such as the 3-step "How it works" and the 2-column results view) stack cleanly into a single column below `768px`.
  - Zero horizontal scrollbars at 375px.

---

## 4. Components

### Primary Buttons
- Background: `#FFE500`
- Text: `#000000`, font-weight `700`, size `14px`–`15px`.
- Radius: `0px` or `4px` (sharp, confident, architectural).
- Hover: Slight brightness drop (`#F0D800`), `scale(0.98)` on active press.

### Persona Evaluation Card (Sample & Ranked List)
- Surface: Crisp `#FFFFFF` card or high-contrast cobalt card.
- Score Display: Bold numeral (e.g. `8/10`) with an inline horizontal yellow progress bar.
- Text: Clear hot take in quotes, distinct primary objection label, expandable when long.
- No Radar Charts: All evaluations are represented through ranked list views and inline score bars.

### Objection Playbook
- Rendered as an actionable checklist of concrete fixes `[✓]`.
- Suggestions requiring clinical proof or doctor endorsements are explicitly tagged `"if true"` / `"needs validation"`.
- Sanitized markdown with zero raw HTML and disabled image rendering.

---

## 5. Motion Guidelines

- Built with Framer Motion (`motion`) + CSS.
- Fast, purposeful transitions (duration `< 800ms`).
- Animate only `transform` and `opacity`. No layout-shifting geometry or `transition: all`.
- Idle float: Slow, subtle CSS drift (`6s ease-in-out infinite`).
- Mouse parallax: Subtle desktop-only tilt on the hero sculpture cluster (`<= 8deg`).
- **Prefers-Reduced-Motion:** Strictly honored across all components; disables parallax, idle float, and staggered entrance transitions.
