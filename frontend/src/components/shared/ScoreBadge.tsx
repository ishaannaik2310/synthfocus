"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { CountUp } from "./CountUp";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  animateSettle?: boolean;
}

export function ScoreBadge({ score, size = "md", animateSettle = true }: ScoreBadgeProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm font-bold",
    lg: "px-3 py-1.5 text-base font-black",
  }[size];

  const colorClasses =
    score >= 7
      ? "bg-[#ffe500]/15 text-[#ffe500] border-[#ffe500]/40"
      : score >= 4
      ? "bg-amber-400/15 text-amber-300 border-amber-400/40"
      : "bg-[#d95d39]/15 text-[#d95d39] border-[#d95d39]/40";

  if (shouldReduceMotion || !animateSettle) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border tabular-nums ${colorClasses} ${sizeClasses}`}
        aria-label={`Score: ${score} out of 10`}
      >
        <span>{score}</span>
        <span className="opacity-70 text-xs">/10</span>
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 1.15, opacity: 0.9 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-1 rounded-full border tabular-nums origin-right ${colorClasses} ${sizeClasses}`}
      aria-label={`Score: ${score} out of 10`}
    >
      <CountUp end={score} duration={350} />
      <span className="opacity-70 text-xs">/10</span>
    </motion.span>
  );
}
