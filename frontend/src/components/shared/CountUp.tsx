"use client";

import { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "motion/react";

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  formatTwoDigits?: boolean;
  className?: string;
}

export function CountUp({
  end,
  start = 0,
  duration = 700,
  decimals = 0,
  prefix = "",
  suffix = "",
  formatTwoDigits = false,
  className = "",
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const [value, setValue] = useState(end); // Default to end value for SSR / no-JS resilience
  const [mounted, setMounted] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || shouldReduceMotion) {
      setValue(end);
      return;
    }

    const startTime = performance.now();
    const range = end - start;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + range * easeProgress;
      setValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, start, duration, mounted, shouldReduceMotion]);

  const formatted = () => {
    if (formatTwoDigits) {
      const rounded = Math.round(value);
      return rounded < 10 ? `0${rounded}` : `${rounded}`;
    }
    return value.toFixed(decimals);
  };

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted()}
      {suffix}
    </span>
  );
}
