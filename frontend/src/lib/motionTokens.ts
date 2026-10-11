/**
 * Shared Motion Tokens and Utilities
 * Aligned with .agent/skills/impeccable/reference/animate.md
 */

export const TRANSITION_EASING = {
  /** Natural confident deceleration */
  easeOut: [0.16, 1, 0.3, 1] as const,
  /** Symmetrical transition */
  easeInOut: [0.4, 0, 0.2, 1] as const,
};

export const MOTION_DURATIONS = {
  /** 150ms: immediate feedback, hover lift, press states */
  instant: 0.15,
  /** 250ms: routine state changes, cross-fades */
  fast: 0.25,
  /** 400ms: reveals, card arrivals */
  normal: 0.4,
  /** 600ms: authored focal moments */
  deliberate: 0.6,
};
