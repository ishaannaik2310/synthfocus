/**
 * General UI utility helpers for SynthFocus.
 */

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Returns semantic color classes based on a 0-10 persona score.
 */
export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  hex: string;
} {
  if (score >= 7) {
    return {
      text: "text-[#27a644]",
      bg: "bg-[#27a644]/10",
      border: "border-[#27a644]/30",
      hex: "#27a644",
    };
  }
  if (score >= 5) {
    return {
      text: "text-[#e5a100]",
      bg: "bg-[#e5a100]/10",
      border: "border-[#e5a100]/30",
      hex: "#e5a100",
    };
  }
  return {
    text: "text-[#eb5757]",
    bg: "bg-[#eb5757]/10",
    border: "border-[#eb5757]/30",
    hex: "#eb5757",
  };
}

/**
 * Sanitizes and truncates strings cleanly.
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}
