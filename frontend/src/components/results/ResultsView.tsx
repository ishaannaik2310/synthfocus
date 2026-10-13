"use client";

import React from "react";
import { FinalReport } from "../../types/simulation";
import { KPIBar } from "./KPIBar";
import { RankedPersonaList } from "./RankedPersonaList";
import { PlaybookPanel } from "./PlaybookPanel";
import { COPY } from "../../lib/copy";

interface ResultsViewProps {
  report: FinalReport;
  onRunAgain: () => void;
}

export function ResultsView({ report, onRunAgain }: ResultsViewProps) {
  return (
    <div className="space-y-10">
      {/* Top Banner with Heading & Run Again CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-6 pt-2">
        <div className="space-y-1">
          <h1 className="font-display-condensed text-3xl sm:text-4xl lg:text-5xl tracking-normal text-white">
            {COPY.results.heading}
          </h1>
          <p className="text-sm sm:text-base text-[#dce4ff]">
            {COPY.results.subheading}
          </p>
        </div>

        <button
          type="button"
          onClick={onRunAgain}
          className="self-start sm:self-center px-6 py-3 rounded-xl text-sm font-bold bg-[#ffe500] hover:bg-[#f0d800] hover:-translate-y-0.5 text-black transition-[transform,background-color,box-shadow] duration-150 ease-out shadow-md active:translate-y-0 active:scale-[0.98] cursor-pointer shrink-0 uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#133ee8]"
        >
          {COPY.results.runAgainButton}
        </button>
      </div>

      {/* 1. Quantitative KPI Bar */}
      <KPIBar metrics={report.metrics} />

      {/* 2. Ranked 10-Persona Breakdown (Inline Score Bars, No Radar Chart) */}
      <RankedPersonaList personas={report.persona_results} />

      {/* 3. Objection-Handling Playbook Panel (Checklist Format) */}
      <PlaybookPanel
        markdown={report.playbook_markdown}
        executiveSummary={report.executive_summary}
      />

      {/* Bottom Run Again CTA */}
      <div className="pt-6 pb-12 flex justify-center border-t border-white/10">
        <button
          type="button"
          onClick={onRunAgain}
          className="px-8 py-4 rounded-xl text-sm font-bold bg-[#ffe500] hover:bg-[#f0d800] hover:-translate-y-0.5 text-black transition-[transform,background-color,box-shadow] duration-150 ease-out shadow-md active:translate-y-0 active:scale-[0.98] cursor-pointer uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#133ee8]"
        >
          ↑ {COPY.results.runAgainButton}
        </button>
      </div>
    </div>
  );
}
