"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export function HeroPersonaCluster() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Controlled subtle desktop tilt strictly limited to <= 3 degrees
    setTilt({
      x: -y * 3,
      y: x * 3,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-motion="true"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] aspect-[16/10] items-center justify-center"
      style={{ perspective: 800 }}
      aria-label="Ten distinct soft clay buyer figures standing in a loose semicircle on a pale podium"
      role="img"
    >
      <div
        className={`relative flex items-center justify-center h-full w-full ${
          !shouldReduceMotion ? "animate-idle-float" : ""
        }`}
        style={{
          transform: !shouldReduceMotion
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            : "none",
          transition: "transform 0.15s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Yellow offset block behind the framed image with counter-tilt depth shift */}
        <div
          className="absolute inset-0 rounded-2xl bg-[#ffe500]"
          style={{
            transform: !shouldReduceMotion
              ? `translate3d(${14 - tilt.y * 1.5}px, ${14 + tilt.x * 1.5}px, -15px)`
              : "translate3d(14px, 14px, 0)",
            transition: "transform 0.15s ease-out",
          }}
        />

        {/* Framed image container tightly matching the 16:10 crop */}
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/20 bg-[#133ee8]">
          <Image
            src="/images/hero-buyers.webp"
            alt="Ten soft clay buyer figures standing in a loose semicircle on a pale wooden podium representing ten consumer archetypes"
            width={954}
            height={575}
            priority
            className="h-full w-full object-cover select-none pointer-events-none"
          />
        </div>
      </div>
    </motion.div>
  );
}
