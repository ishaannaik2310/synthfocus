import React from "react";
import { COPY } from "../../lib/copy";

interface TelemetryTickerProps {
  messages: string[];
  isThrottling: boolean;
  throttleSeconds: number;
  currentBatchIndex: number;
}

export function TelemetryTicker({
  messages,
  isThrottling,
  throttleSeconds,
  currentBatchIndex,
}: TelemetryTickerProps) {
  const latestMessage = messages[messages.length - 1] || "Initializing focus group engine…";

  return (
    <div
      className="rounded-lg border border-hairline bg-surface-1 px-4 py-3 flex items-center gap-3 text-xs sm:text-sm font-mono text-ink shadow-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`w-2 h-2 rounded-full ${
            isThrottling
              ? "bg-[#ffe500] animate-calm-breathe"
              : "bg-[#ffe500] animate-pulse"
          }`}
        />
        <span className="text-[11px] uppercase tracking-wider text-white/70 hidden sm:inline">
          {isThrottling ? "GUARD ACTIVE" : "TELEMETRY"}
        </span>
      </div>

      <div className="flex-1 truncate">
        {isThrottling ? (
          <span className="text-warning font-medium">
            {COPY.ticker.onThrottleCountdown(throttleSeconds, currentBatchIndex + 2)}{" "}
            <span className="text-ink-subtle hidden md:inline font-sans font-normal">
              — Pacing deliberately to safeguard Gemini Free-Tier RPM.
            </span>
          </span>
        ) : (
          <span className="text-ink-muted">{latestMessage}</span>
        )}
      </div>

      {isThrottling && (
        <div className="tabular-nums font-semibold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 text-xs shrink-0">
          {throttleSeconds}s
        </div>
      )}
    </div>
  );
}
