"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useSimulation } from "@/hooks/useSimulation";
import { COPY } from "@/lib/copy";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { SimulationInput } from "@/components/input/SimulationInput";
import { TelemetryTicker } from "@/components/processing/TelemetryTicker";
import { BatchProgressBar } from "@/components/processing/BatchProgressBar";
import { PersonaCardSkeleton } from "@/components/processing/PersonaCardSkeleton";
import { PersonaCard } from "@/components/results/PersonaCard";
import { AnalystSynthesizing } from "@/components/processing/AnalystSynthesizing";
import { ResultsView } from "@/components/results/ResultsView";

export default function RunSimulationPage() {
  const shouldReduceMotion = useReducedMotion();
  const {
    phase,
    brief,
    setBrief,
    runSimulation,
    cancelSimulation,
    resetSimulation,
    personas,
    isThrottling,
    throttleSecondsRemaining,
    completedBatches,
    totalBatches,
    currentBatchIndex,
    isAnalystSynthesizing,
    tickerMessages,
    finalReport,
    error,
  } = useSimulation();

  const isRunning = phase === "submitting" || phase === "streaming";

  return (
    <div className="min-h-screen bg-[#133ee8] text-white selection:bg-[#ffe500] selection:text-black flex flex-col justify-between">
      {/* Top Tool Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#133ee8]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span className="font-display-condensed text-2xl tracking-normal text-white">
              {COPY.nav.brand}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-wider text-[#dce4ff] hover:text-white transition-colors"
            >
              ← Back to Overview
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="relative flex-1 py-10 sm:py-14">
        <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Error Banner when state error is present */}
          {error && (
            <div className="mb-10">
              <ErrorBanner
                error={error}
                onRetry={() => {
                  if (isRunning) {
                    cancelSimulation();
                  }
                  resetSimulation();
                }}
              />
            </div>
          )}

          {/* 1. INPUT PHASE */}
          {(phase === "idle" || phase === "error") && (
            <motion.div
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h1 className="font-display-condensed text-3xl sm:text-4xl text-white">
                  {COPY.input.title}
                </h1>
                <p className="text-sm sm:text-base text-[#dce4ff]">
                  {COPY.input.subtitle}
                </p>
              </div>

              <SimulationInput
                brief={brief}
                onChange={setBrief}
                onSubmit={() => runSimulation()}
                onCancel={cancelSimulation}
                isLoading={false}
              />
            </motion.div>
          )}

          {/* 2. PROCESSING PHASE */}
          {isRunning && (
            <motion.div
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h1 className="font-display-condensed text-3xl text-white">
                    GRILLING THE AUDIENCE
                  </h1>
                  <p className="text-xs sm:text-sm text-[#dce4ff]">
                    Simulating 10 skeptical consumer personas in parallel micro-batches.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cancelSimulation}
                  className="px-4 py-2 border border-white/20 text-xs font-bold uppercase text-white hover:bg-white/10 active:scale-[0.98] transition-[transform,background-color] duration-150 ease-out rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Cancel Run
                </button>
              </div>

              {/* Progress & Live Telemetry Ticker */}
              <BatchProgressBar
                totalBatches={totalBatches}
                completedBatches={completedBatches}
                currentBatchIndex={currentBatchIndex}
                isThrottling={isThrottling}
                throttleSeconds={throttleSecondsRemaining}
              />

              <TelemetryTicker
                messages={tickerMessages}
                isThrottling={isThrottling}
                throttleSeconds={throttleSecondsRemaining}
                currentBatchIndex={currentBatchIndex}
              />

              {/* Analyst Synthesizing State */}
              {isAnalystSynthesizing && <AnalystSynthesizing />}

              {/* In-Flight Evaluated Personas Grid */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-white/70">
                    Live Evaluations ({personas.length} of 10 completed)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personas.map((p, idx) => (
                    <PersonaCard key={p.persona_id} persona={p} index={idx} />
                  ))}

                  {/* Skeletons for pending personas */}
                  {personas.length < 10 && (
                    <PersonaCardSkeleton count={Math.min(2, 10 - personas.length)} />
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. RESULTS PHASE */}
          {phase === "results" && finalReport && (
            <motion.div
              initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ResultsView
                report={finalReport}
                onRunAgain={resetSimulation}
              />
            </motion.div>
          )}
        </div>
      </main>

      {/* Tool Footer */}
      <footer className="w-full border-t border-white/10 bg-[#0e2cb3] py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8 text-xs font-mono text-white/70">
          <p>{COPY.footer.disclaimer}</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/#how-it-works" className="hover:text-white transition-colors">
              How it works
            </Link>
            <Link href="/#example" className="hover:text-white transition-colors">
              Example
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
