import React from "react";
import { COPY } from "../../lib/copy";

interface BuyReadyBadgeProps {
  buyReady: boolean;
}

export function BuyReadyBadge({ buyReady }: BuyReadyBadgeProps) {
  if (buyReady) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffe500]/15 text-[#ffe500] border border-[#ffe500]/40"
        aria-label="Simulated persona would purchase today"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#ffe500]" />
        {COPY.personaCard.buyReadyTrue}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/20"
      aria-label="Simulated persona has reservations or would not purchase"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
      {COPY.personaCard.buyReadyFalse}
    </span>
  );
}
