import React from "react";

interface PersonaCardSkeletonProps {
  count?: number;
}

export function PersonaCardSkeleton({ count = 1 }: PersonaCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-white/20 bg-white/5 p-5 space-y-4 animate-pulse flex flex-col justify-between rounded-xl shadow-lg"
        >
          {/* Header stub */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="w-44 h-4 bg-white/20 rounded" />
              <div className="w-28 h-5 bg-white/10 border border-white/15 rounded-full" />
            </div>
            <div className="w-14 h-7 bg-white/15 border border-white/20 rounded-full" />
          </div>

          {/* Critique stub */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="w-16 h-2.5 bg-[#ffe500]/30 rounded" />
            <div className="space-y-1.5">
              <div className="w-full h-3.5 bg-white/15 rounded" />
              <div className="w-4/5 h-3.5 bg-white/15 rounded" />
            </div>
          </div>

          {/* Objection stub */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="w-24 h-2.5 bg-[#d95d39]/30 rounded" />
            <div className="space-y-1.5">
              <div className="w-full h-3.5 bg-white/15 rounded" />
              <div className="w-3/4 h-3.5 bg-white/15 rounded" />
            </div>
          </div>

          {/* Tags stub */}
          <div className="pt-2 border-t border-white/10 flex gap-2">
            <div className="w-16 h-4 bg-white/10 border border-white/15 rounded-full" />
            <div className="w-20 h-4 bg-[#ffe500]/10 border border-[#ffe500]/20 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}
