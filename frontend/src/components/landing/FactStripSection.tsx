"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { COPY } from "@/lib/copy";
import { CountUp } from "@/components/shared/CountUp";

const PERSONA_NAMES = [
  "The Zingy Gen-Z Trend Chaser",
  "The Crunch-Time Cooking Mom",
  "The Skeptical Corporate Millennial",
  "The Tech-Bro Developer",
  "The Holistic Wellness Yogi",
  "The High-Income DINK",
  "The Hustle-Culture Solopreneur",
  "The Frugal College Student",
  "The Rural Traditionalist",
  "The Wealthy Boomer Empty Nester",
];

export function FactStripSection() {
  const shouldReduceMotion = useReducedMotion();
  const [inView, setInView] = useState(false);

  return (
    <section className="relative border-b border-white/10 bg-[#0e2cb3] py-8 sm:py-10 overflow-hidden">
      <motion.div
        onViewportEnter={() => setInView(true)}
        viewport={{ once: true, amount: 0.15 }}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 divide-y divide-white/15 sm:grid-cols-3 sm:divide-y-0 sm:divide-x sm:divide-white/15">
          {COPY.factStrip.map((item, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-start ${
                idx === 0
                  ? "sm:pr-8 pb-6 sm:pb-0"
                  : idx === 1
                  ? "sm:px-8 py-6 sm:py-0"
                  : "sm:pl-8 pt-6 sm:pt-0"
              }`}
            >
              <div className="font-display-condensed text-5xl sm:text-6xl lg:text-7xl leading-none text-[#ffe500] tracking-tight tabular-nums">
                {idx === 0 && (
                  inView ? <CountUp end={10} duration={600} /> : "10"
                )}
                {idx === 1 && (
                  inView ? <CountUp prefix="~" end={70} suffix="S" duration={700} /> : "~70S"
                )}
                {idx === 2 && (
                  inView ? <CountUp end={1} formatTwoDigits duration={500} /> : "01"
                )}
              </div>
              <div className="mt-2 text-sm font-extrabold uppercase tracking-wider text-white">
                {item.label}
              </div>
              <div className="mt-0.5 text-xs font-normal text-[#dce4ff]">
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scrolling Row of the 10 Real Persona Archetypes - Clean, no dark pill strip, no browser scrollbars */}
      <div className="mt-8 border-t border-white/10 py-3 overflow-hidden select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className={`flex gap-6 whitespace-nowrap font-display-condensed text-sm sm:text-base font-bold uppercase tracking-wider text-white/90 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            !shouldReduceMotion ? "animate-marquee" : "overflow-x-auto"
          }`}
        >
          {PERSONA_NAMES.map((name, i) => (
            <span key={`p1-${i}`} className="inline-flex items-center gap-6">
              <span>{name}</span>
              <span className="text-[#ffe500]">·</span>
            </span>
          ))}
          {PERSONA_NAMES.map((name, i) => (
            <span key={`p2-${i}`} className="inline-flex items-center gap-6">
              <span>{name}</span>
              <span className="text-[#ffe500]">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
