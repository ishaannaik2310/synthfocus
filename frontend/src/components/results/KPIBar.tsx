"use client";

import React from "react";
import { COPY } from "../../lib/copy";
import { SimulationMetrics } from "../../types/simulation";
import { CountUp } from "../shared/CountUp";

interface KPIBarProps {
  metrics: SimulationMetrics;
}

export function KPIBar({ metrics }: KPIBarProps) {
  const total = metrics.total_personas || 10;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
      {/* 1. Average Score */}
      <div className="border border-white/20 bg-white/5 p-5 sm:p-6 space-y-1 rounded-xl shadow-lg">
        <span className="text-xs uppercase tracking-wider text-[#dce4ff] font-bold">
          {COPY.results.kpi.averageScore}
        </span>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-display-condensed text-4xl sm:text-5xl font-bold tabular-nums text-white">
            <CountUp end={metrics.average_score} decimals={1} duration={600} />
          </span>
          <span className="text-sm text-white/70">/ 10</span>
        </div>
        <p className="text-xs text-[#dce4ff]/80">
          Range: {metrics.min_score} – {metrics.max_score} / 10
        </p>
      </div>

      {/* 2. Buy-Ready Count */}
      <div className="border border-white/20 bg-white/5 p-5 sm:p-6 space-y-1 rounded-xl shadow-lg">
        <span className="text-xs uppercase tracking-wider text-[#dce4ff] font-bold">
          {COPY.results.kpi.buyReadyCount}
        </span>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-display-condensed text-4xl sm:text-5xl font-bold tabular-nums text-[#ffe500]">
            <CountUp end={metrics.buy_ready_count} duration={500} />
          </span>
          <span className="text-sm text-white/70">
            {COPY.results.kpi.buyReadySuffix(total)}
          </span>
        </div>
        <p className="text-xs text-[#dce4ff]/80">
          {COPY.results.kpi.buyReadySub}
        </p>
      </div>

      {/* 3. Score Spread */}
      <div className="border border-white/20 bg-white/5 p-5 sm:p-6 space-y-1 rounded-xl shadow-lg">
        <span className="text-xs uppercase tracking-wider text-[#dce4ff] font-bold">
          {COPY.results.kpi.scoreSpread}
        </span>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-display-condensed text-4xl sm:text-5xl font-bold tabular-nums text-white">
            <CountUp prefix="±" end={metrics.score_spread} decimals={2} duration={600} />
          </span>
          <span className="text-sm text-white/70">σ</span>
        </div>
        <p className="text-xs text-[#dce4ff]/80">
          {metrics.score_spread < 1.0
            ? "Panel mostly agrees"
            : metrics.score_spread <= 2.0
            ? "Mixed reactions"
            : "Panel is split"}
        </p>
      </div>
    </div>
  );
}
