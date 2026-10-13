import React from "react";

interface SampleChipProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function SampleChip({ label, onClick, disabled }: SampleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/20 hover:border-white/40 transition-[transform,background-color,border-color] duration-150 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe500]"
    >
      + {label}
    </button>
  );
}
