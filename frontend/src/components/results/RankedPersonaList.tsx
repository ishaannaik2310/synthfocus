"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PersonaEvaluation } from "../../types/simulation";
import { COPY } from "../../lib/copy";

interface RankedPersonaListProps {
  personas: PersonaEvaluation[];
}

export function RankedPersonaList({ personas }: RankedPersonaListProps) {
  const shouldReduceMotion = useReducedMotion();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Deduplicate and rank descending by score_out_of_10
  const uniquePersonas = Array.from(
    new Map(personas.map((p) => [p.persona_id, p])).values()
  );
  const rankedPersonas = [...uniquePersonas].sort(
    (a, b) => b.score_out_of_10 - a.score_out_of_10
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/20 pb-3">
        <h2 className="font-display-condensed text-2xl text-white sm:text-3xl">
          {COPY.results.rankedHeading}
        </h2>
        <span className="text-xs font-mono text-white/70">
          Ranked 1–{rankedPersonas.length} by simulated favorability
        </span>
      </div>

      <div className="space-y-3">
        {rankedPersonas.map((persona, index) => {
          const scorePercent = Math.min(100, Math.max(0, persona.score_out_of_10 * 10));
          const isExpanded = !!expandedIds[persona.persona_id];
          const isLongText =
            (persona.one_sentence_critique && persona.one_sentence_critique.length > 90) ||
            (persona.primary_objection && persona.primary_objection.length > 90);

          return (
            <motion.div
              key={persona.persona_id}
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.28,
                delay: shouldReduceMotion ? 0 : Math.min(0.4, index * 0.04),
                ease: [0.16, 1, 0.3, 1],
              }}
              className="border border-white/15 bg-white/5 p-4 sm:p-5 transition-[border-color,background-color] duration-150 ease-out hover:border-white/30 hover:bg-white/[0.08] rounded-xl"
            >
              {/* Top Row: Rank, Persona, Score & Progress Bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Identity */}
                <div className="flex items-center gap-3">
                  <span className="font-display-condensed text-xl text-white/50">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white sm:text-lg">
                      {persona.persona_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          persona.buy_readiness ? "text-[#ffe500]" : "text-white/60"
                        }`}
                      >
                        {persona.buy_readiness
                          ? COPY.personaCard.buyReadyTrue
                          : COPY.personaCard.buyReadyFalse}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inline Score Bar (transform scaleX to avoid layout recalculation) */}
                <div className="flex items-center gap-3 sm:w-64">
                  <div className="h-3 flex-1 overflow-hidden bg-black/40 rounded-full">
                    <motion.div
                      className={`h-full rounded-full origin-left ${
                        persona.score_out_of_10 >= 7
                          ? "bg-[#ffe500]"
                          : persona.score_out_of_10 >= 4
                          ? "bg-amber-400"
                          : "bg-[#d95d39]"
                      }`}
                      style={{ width: `${scorePercent}%` }}
                      initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.35,
                        delay: shouldReduceMotion ? 0 : Math.min(0.4, index * 0.04) + 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  </div>
                  <span className="font-display-condensed min-w-[50px] text-right text-lg text-white tabular-nums">
                    {persona.score_out_of_10}/10
                  </span>
                </div>
              </div>

              {/* Bottom Row: Hot Take & Primary Objection */}
              <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-sm">
                {/* Hot Take */}
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="font-semibold text-[#ffe500] shrink-0">
                    {COPY.personaCard.critiqueLabel}:
                  </span>
                  <p
                    className={`italic text-white/95 leading-relaxed ${
                      !isExpanded ? "line-clamp-3 sm:line-clamp-none" : ""
                    }`}
                  >
                    &ldquo;{persona.one_sentence_critique}&rdquo;
                  </p>
                </div>

                {/* Primary Objection */}
                <div className="flex flex-col sm:flex-row sm:gap-2 text-white/80">
                  <span className="font-semibold text-[#d95d39] shrink-0">
                    {COPY.personaCard.objectionLabel}:
                  </span>
                  <p className={`leading-relaxed ${!isExpanded ? "line-clamp-3 sm:line-clamp-none" : ""}`}>
                    {persona.primary_objection}
                  </p>
                </div>

                {/* Expand / Collapse Button if text is long */}
                {isLongText && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(persona.persona_id)}
                    className="mt-1 text-xs font-semibold text-white/70 hover:text-white underline cursor-pointer"
                  >
                    {isExpanded ? COPY.personaCard.collapseText : COPY.personaCard.expandText}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
