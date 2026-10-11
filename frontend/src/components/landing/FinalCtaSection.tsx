"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { COPY } from "@/lib/copy";

export function FinalCtaSection() {
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
        duration: shouldReduceMotion ? 0 : 0.45,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#133ee8] py-16 sm:py-20">
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={isMotionActive ? "hidden" : "visible"}
          whileInView="visible"
          animate={forceVisible ? "visible" : undefined}
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="flex flex-col items-start max-w-3xl"
        >
          {/* Headline */}
          <h2 className="font-display-condensed mb-6 text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl tracking-normal">
            <span className="block">STOP GUESSING.</span>
            <span className="block">GRILL YOUR PITCH.</span>
          </h2>

          {/* Subhead */}
          <p className="mb-8 max-w-xl text-lg text-[#dce4ff] sm:text-xl">
            {COPY.finalCta.subtitle}
          </p>

          {/* CTA Button with restrained pulse (stops on hover and reduced motion) */}
          <div className="flex flex-col items-start gap-3">
            <Link
              href="/run"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffe500] px-8 py-4 text-base font-extrabold uppercase tracking-wide text-black shadow-xl animate-btn-pulse transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#f0d800] hover:shadow-2xl active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#133ee8]"
            >
              <span>{COPY.finalCta.ctaButton}</span>
              <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
            </Link>
            <span className="text-xs font-medium text-white/70">
              {COPY.finalCta.disclaimer}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
