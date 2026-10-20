"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { COPY } from "@/lib/copy";
import { HeroPersonaCluster } from "./HeroPersonaCluster";

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#133ee8] pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-14">
      {/* Background structural coordinate rules */}
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headlines & CTA */}
          <div className="z-20 flex flex-col items-start lg:col-span-7">
            {/* Headline: strictly 2 lines on desktop, text-wrap: balance, staggered line entrance */}
            <h1
              className="font-display-condensed mb-6 text-5xl leading-[0.92] tracking-normal text-white sm:text-6xl md:text-7xl lg:text-[4.75rem] xl:text-[5.5rem]"
              style={{ textWrap: "balance" }}
            >
              <motion.span
                className="block overflow-hidden"
                data-motion="true"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                KILL THE SLOW{" "}
              </motion.span>
              <motion.span
                className="block overflow-hidden"
                data-motion="true"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                FOCUS GROUP.
              </motion.span>
            </h1>

            {/* Subhead */}
            <motion.p
              data-motion="true"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 max-w-xl text-lg font-normal leading-relaxed text-[#dce4ff] sm:text-xl"
            >
              {COPY.hero.subhead}
            </motion.p>

            {/* CTA Button and Disclaimer */}
            <motion.div
              data-motion="true"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-start gap-3"
            >
              <Link
                href="/run"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffe500] px-8 py-4 text-base font-extrabold uppercase tracking-wide text-black shadow-xl transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#f0d800] hover:shadow-2xl active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#133ee8]"
              >
                <span>{COPY.hero.ctaButton}</span>
                <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
              </Link>
              <span className="text-xs font-medium text-white/70">
                {COPY.hero.disclaimer}
              </span>
            </motion.div>
          </div>

          {/* Right Column: 10 Persona 3D Cluster framed and clipped */}
          <div className="relative z-10 flex items-center justify-center lg:col-span-5 lg:pl-4">
            <HeroPersonaCluster />
          </div>
        </div>
      </div>
    </section>
  );
}
