"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PersonaEvaluation } from "../../types/simulation";
import { COPY } from "../../lib/copy";

interface PersonaRadarChartProps {
  personas: PersonaEvaluation[];
}

export function PersonaRadarChart({ personas }: PersonaRadarChartProps) {
  const chartData = personas.map((p) => {
    // Truncate name for radar point label to avoid edge clipping on mobile
    const shortName =
      p.persona_name.length > 12
        ? p.persona_name.slice(0, 11) + "…"
        : p.persona_name;

    return {
      persona: shortName,
      fullName: p.persona_name,
      score: p.score_out_of_10,
      buyReadiness: p.buy_readiness ? "Yes" : "No",
    };
  });

  return (
    <div className="rounded-xl border border-hairline bg-surface-1 p-4 sm:p-6 space-y-4 my-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-ink uppercase tracking-wider">
          {COPY.results.radarHeading}
        </h3>
        <span className="text-xs text-ink-subtle">Domain: 0 – 10</span>
      </div>

      {/* Accessible table for screen readers (Rule 8) */}
      <div className="sr-only">
        <table aria-label="Persona scores data table">
          <thead>
            <tr>
              <th scope="col">Persona</th>
              <th scope="col">Score (out of 10)</th>
              <th scope="col">Buy-Ready</th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.persona_id}>
                <td>{p.persona_name}</td>
                <td>{p.score_out_of_10}</td>
                <td>{p.buy_readiness ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h-72 sm:h-80 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="62%"
            data={chartData}
            margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <PolarGrid stroke="#23252a" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="persona"
              tick={{ fill: "#8a8f98", fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: "#62666d", fontSize: 10 }}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-hairline bg-surface-2 p-3 text-xs shadow-lg space-y-1">
                      <p className="font-semibold text-ink">{data.fullName}</p>
                      <p className="text-ink-muted">
                        Score:{" "}
                        <span className="font-bold text-primary">
                          {data.score}/10
                        </span>
                      </p>
                      <p className="text-ink-subtle">
                        Buy-Ready: {data.buyReadiness}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#5e6ad2"
              fill="#5e6ad2"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
