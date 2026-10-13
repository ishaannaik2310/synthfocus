"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { COPY } from "@/lib/copy";

export function HowItWorksSection() {
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
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const figureVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  // Noticeably larger tactile clay-style buyer shapes beside each numeral
  const StepFigures = [
    // Step 01: Sphere head on rounded cylinder body (Yellow & Cream)
    (
      <svg key="step-fig-1" viewBox="0 0 100 100" className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-lg" fill="none">
        <rect x="30" y="44" width="40" height="46" rx="20" fill="#FFE500" />
        <circle cx="50" cy="28" r="20" fill="#FFFFFF" />
        <circle cx="44" cy="24" r="6" fill="#F0F4FF" opacity="0.8" />
      </svg>
    ),
    // Step 02: Sphere head on terracotta cylinder body
    (
      <svg key="step-fig-2" viewBox="0 0 100 100" className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-lg" fill="none">
        <rect x="28" y="44" width="44" height="46" rx="20" fill="#D95D39" />
        <circle cx="50" cy="28" r="20" fill="#E87A5B" />
        <circle cx="44" cy="24" r="6" fill="#FFFFFF" opacity="0.3" />
      </svg>
    ),
    // Step 03: Sphere head on soft blue cylinder body with golden cap
    (
      <svg key="step-fig-3" viewBox="0 0 100 100" className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-lg" fill="none">
        <rect x="28" y="44" width="44" height="46" rx="20" fill="#60A5FA" />
        <circle cx="50" cy="28" r="20" fill="#93C5FD" />
        <polygon points="50,6 40,20 60,20" fill="#FFE500" />
      </svg>
    ),
  ];

  return (
    <section id="how-it-works" className="relative border-b border-white/10 bg-[#133ee8] py-16 sm:py-20">
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
            {COPY.howItWorks.title}
          </h2>
          <p className="text-lg text-[#dce4ff] sm:text-xl">
            {COPY.howItWorks.subtitle}
          </p>
        </motion.div>

        {/* 3-Column Progression with high-contrast numerals and larger figures */}
        <motion.div
          initial={isMotionActive ? "hidden" : "visible"}
          whileInView="visible"
          animate={forceVisible ? "visible" : undefined}
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8 lg:gap-10"
        >
          {COPY.howItWorks.steps.map((step, index) => (
            <motion.div
              key={step.numeral}
              variants={itemVariants}
              className="flex flex-col items-start border-l-2 border-white/20 pl-6 sm:pl-8"
            >
              <motion.div variants={figureVariants} className="mb-4 flex items-center gap-4">
                {StepFigures[index]}
                <span className="font-display-condensed text-5xl font-extrabold text-[#ffe500] sm:text-6xl">
                  {step.numeral}
                </span>
              </motion.div>
              <h3 className="font-display-condensed mb-2 text-2xl tracking-normal text-white sm:text-3xl">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-[#dce4ff]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
