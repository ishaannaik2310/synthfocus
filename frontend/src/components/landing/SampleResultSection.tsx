"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { COPY } from "@/lib/copy";

export function SampleResultSection() {
  const shouldReduceMotion = useReducedMotion();
  const [isHydrated, setIsHydrated] = useState(false);
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const timer = setTimeout(() => {
      setForceVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const isMotionActive = isHydrated && !shouldReduceMotion && !forceVisible;

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section id="example" className="relative border-b border-white/10 bg-[#133ee8] py-16 sm:py-20">
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={isMotionActive ? "hidden" : "visible"}
          whileInView="visible"
          animate={forceVisible ? "visible" : undefined}
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="mb-12 max-w-3xl"
        >
          <h2 className="font-display-condensed mb-3 text-4xl leading-[0.95] text-white sm:text-5xl md:text-6xl tracking-normal">
            {COPY.sampleResult.title}
          </h2>
          <p className="text-lg text-[#dce4ff] sm:text-xl">
            {COPY.sampleResult.subtitle}
          </p>
        </motion.div>

        {/* Evaluation Card Container: Unified wide card with figure beside card top */}
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={isMotionActive ? "hidden" : "visible"}
            whileInView="visible"
            animate={forceVisible ? "visible" : undefined}
            viewport={{ once: true, amount: 0.15 }}
            variants={containerVariants}
            className="rounded-2xl bg-surface-card p-6 text-ink-card-primary shadow-2xl sm:p-10"
          >
            {/* Top Label & Product Tag */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border-card pb-4">
              <span className="inline-block rounded-full bg-[#133ee8] px-3.5 py-1 text-xs font-black tracking-widest text-white uppercase">
                {COPY.sampleResult.cardLabel}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-card-muted">
                {COPY.sampleResult.productTag}
              </span>
            </div>

            {/* Persona Header with Figure beside top on sm/md/lg */}
            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5 sm:gap-6">
                {/* Noticeably larger clay figure beside the card top */}
                <div className="flex-shrink-0">
                  <svg viewBox="0 0 120 120" className="h-24 w-24 sm:h-28 sm:w-28 drop-shadow-md" fill="none">
                    <ellipse cx="60" cy="110" rx="45" ry="8" fill="#e5e7eb" />
                    <rect x="36" y="52" width="48" height="52" rx="24" fill="#D95D39" />
                    <circle cx="60" cy="34" r="22" fill="#3B82F6" />
                    <circle cx="53" cy="28" r="7" fill="#FFFFFF" opacity="0.5" />
                    <circle cx="60" cy="74" r="5" fill="#FFE500" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-ink-card-primary sm:text-3xl">
                    {COPY.sampleResult.personaName}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-ink-card-muted">
                    {COPY.sampleResult.category}
                  </p>
                </div>
              </div>

              {/* Score Callout & Progress Bar */}
              <div className="flex flex-col items-start sm:items-end">
                <div className="text-3xl font-black text-ink-card-primary sm:text-4xl tabular-nums">
                  <span className="text-[#d95d39]">{COPY.sampleResult.score}</span>
                  <span className="text-2xl font-semibold text-ink-card-subtle">/10</span>
                </div>
                <div className="mt-2 h-2.5 w-36 overflow-hidden rounded-full bg-surface-track">
                  <motion.div
                    className="h-full w-[30%] origin-left rounded-full bg-[#ffe500]"
                    initial={{ scaleX: shouldReduceMotion ? 1 : 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.5,
                      delay: shouldReduceMotion ? 0 : 0.25,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Hot Take (Quotation) using design token tint & typography - Fades in after score bar */}
            <motion.div
              initial={isMotionActive ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              animate={forceVisible ? { opacity: 1, y: 0 } : undefined}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.35,
                delay: shouldReduceMotion ? 0 : 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mb-6 rounded-xl bg-surface-quote p-5 sm:p-6 border border-border-card/50"
            >
              <p className="text-lg font-bold italic leading-relaxed text-ink-card-primary sm:text-xl">
                &ldquo;{COPY.sampleResult.hotTake}&rdquo;
              </p>
            </motion.div>

            {/* Primary Objection using design token tint */}
            <div className="rounded-xl bg-surface-card-subtle p-5 sm:p-6 border border-border-card/50">
              <span className="text-xs font-extrabold uppercase tracking-wider text-ink-card-muted">
                Primary Objection:
              </span>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-ink-card-primary sm:text-base">
                {COPY.sampleResult.primaryObjection}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
