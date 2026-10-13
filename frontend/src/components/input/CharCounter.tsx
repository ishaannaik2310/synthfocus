import React from "react";
import { COPY } from "../../lib/copy";

interface CharCounterProps {
  count: number;
  min?: number;
  max?: number;
}

export function CharCounter({ count, min = 10, max = 5000 }: CharCounterProps) {
  let colorClass = "text-ink-subtle";
  let statusNote = "";

  if (count > 0 && count < min) {
    colorClass = "text-danger";
    statusNote = `(${COPY.input.minCharsNotice})`;
  } else if (count > max) {
    colorClass = "text-danger font-medium";
    statusNote = "(Exceeds limit)";
  } else if (count >= 4500) {
    colorClass = "text-warning";
  }

  return (
    <div
      className={`text-xs tabular-nums flex items-center gap-1.5 ${colorClass}`}
      aria-live="polite"
    >
      <span>{COPY.input.charCount(count, max)}</span>
      {statusNote && <span className="text-[11px]">{statusNote}</span>}
    </div>
  );
}
