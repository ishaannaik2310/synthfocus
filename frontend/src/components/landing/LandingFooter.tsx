"use client";

import Link from "next/link";
import { COPY } from "@/lib/copy";

export function LandingFooter() {
  return (
    <footer className="w-full bg-[#0e2cb3] py-12 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
          {/* Brand */}
          <Link
            href="/"
            className="font-display-condensed text-2xl tracking-normal text-white"
          >
            {COPY.footer.brand}
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-6 text-sm font-semibold text-white/80">
            {COPY.footer.navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mandatory PRD / Skill Disclaimer */}
        <div className="flex flex-col gap-2 text-xs font-mono text-white/70">
          <p className="font-semibold text-white/90">
            {COPY.footer.disclaimer}
          </p>
          <p className="text-white/60">
            {COPY.footer.secondaryNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
