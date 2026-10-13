"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { PersonaEvaluation } from "../../types/simulation";
import { ScoreBadge } from "../shared/ScoreBadge";
import { BuyReadyBadge } from "../shared/BuyReadyBadge";
import { COPY } from "../../lib/copy";

interface PersonaCardProps {
  persona: PersonaEvaluation;
  index?: number;
}

export function PersonaCard({ persona, index = 0 }: PersonaCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.3,
        delay: shouldReduceMotion ? 0 : Math.min(0.2, (index % 2) * 0.08),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="border border-white/20 bg-white/5 p-5 space-y-4 hover:border-white/40 transition-[border-color,background-color] duration-150 ease-out flex flex-col justify-between rounded-xl shadow-lg"
    >
      {/* Header: Persona identity + Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-bold text-base text-white leading-snug">
            {persona.persona_name}
          </h3>
          <div>
            <BuyReadyBadge buyReady={persona.buy_readiness} />
          </div>
        </div>
        <ScoreBadge score={persona.score_out_of_10} size="md" />
      </div>

      {/* Ruthless critique */}
      <div className="space-y-1.5 pt-2 border-t border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#ffe500]">
          {COPY.personaCard.critiqueLabel}
        </span>
        <p className="text-sm text-white italic leading-relaxed">
          &ldquo;{persona.one_sentence_critique}&rdquo;
        </p>
      </div>

      {/* Primary Objection */}
      <div className="space-y-1.5 pt-2 border-t border-white/10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#d95d39]">
          {COPY.personaCard.objectionLabel}
        </span>
        <p className="text-sm text-[#dce4ff] leading-relaxed">
          {persona.primary_objection}
        </p>
      </div>

      {/* Tags: Key frustrations & Trigger words */}
      {(persona.key_frustrations.length > 0 || persona.trigger_words.length > 0) && (
        <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
          {persona.key_frustrations.map((f, i) => (
            <span
              key={`frust-${i}`}
              className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/40 text-white/70 border border-white/15"
            >
              {f}
            </span>
          ))}
          {persona.trigger_words.map((tw, i) => (
            <span
              key={`tw-${i}`}
              className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#ffe500]/10 text-[#ffe500] border border-[#ffe500]/30"
            >
              {tw}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}
