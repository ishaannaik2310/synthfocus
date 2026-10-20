"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { COPY } from "@/lib/copy";

export function LandingNav() {
  const shouldReduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      data-motion="true"
      className={`sticky top-0 z-50 w-full transition-[background-color,border-color,backdrop-filter,box-shadow] duration-200 ease-out ${
        scrolled
          ? "border-b border-white/10 bg-[#133ee8]/90 shadow-md backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand: flex-shrink-0 prevents clipping at any screen width */}
        <Link
          href="/"
          className="flex-shrink-0 flex items-center gap-2 rounded-sm font-display-condensed text-2xl tracking-normal text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe500]"
        >
          {COPY.nav.brand}
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-6 sm:gap-8">
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#how-it-works"
              className="group relative rounded-sm py-1 text-[13px] font-medium uppercase tracking-[0.08em] text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe500]"
            >
              <span>{COPY.nav.howItWorks}</span>
              <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-[#ffe500] transition-transform duration-200 ease-out group-hover:scale-x-100" />
            </Link>
            <Link
              href="/#example"
              className="group relative rounded-sm py-1 text-[13px] font-medium uppercase tracking-[0.08em] text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe500]"
            >
              <span>{COPY.nav.example}</span>
              <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-[#ffe500] transition-transform duration-200 ease-out group-hover:scale-x-100" />
            </Link>
          </div>
          {/* CTA Button: 150ms hover lift and tight press state */}
          <Link
            href="/run"
            className="flex-shrink-0 inline-flex items-center justify-center rounded-xl bg-[#ffe500] px-4 py-2 text-sm font-bold text-black shadow transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:bg-[#f0d800] hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#133ee8]"
          >
            {COPY.nav.runSimulation}
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
