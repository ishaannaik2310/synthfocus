import React from "react";
import { COPY } from "../../lib/copy";

export function AnalystSynthesizing() {
  return (
    <div className="border border-white/20 bg-white/5 p-6 text-center space-y-3 relative overflow-hidden my-6 shadow-xl">
      <div className="flex justify-center items-center gap-3">
        <span className="relative flex h-3 w-3 items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffe500] animate-calm-breathe" />
        </span>
        <h3 className="font-display-condensed text-xl sm:text-2xl text-white">
          {COPY.processing.analystSynthesizingTitle}
        </h3>
      </div>
      <p className="text-xs sm:text-sm text-[#dce4ff] max-w-lg mx-auto leading-relaxed">
        {COPY.processing.analystSynthesizingSubtitle}
      </p>
    </div>
  );
}
