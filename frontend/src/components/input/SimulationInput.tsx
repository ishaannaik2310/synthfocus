import React, { useRef } from "react";
import { COPY } from "../../lib/copy";
import { CharCounter } from "./CharCounter";
import { SampleChip } from "./SampleChip";

interface SimulationInputProps {
  brief: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function SimulationInput({
  brief,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
}: SimulationInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charLength = brief.length;
  const isValidLength = charLength >= 10 && charLength <= 5000;

  const handleChipClick = (sampleBrief: string) => {
    onChange(sampleBrief);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to run simulation
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (isValidLength && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="border border-white/20 bg-white/5 p-6 sm:p-8 space-y-6 shadow-xl rounded-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label
          htmlFor="product-brief-input"
          className="text-base font-bold text-white flex items-center gap-2"
        >
          <span>{COPY.input.label}</span>
          <span className="text-xs text-[#dce4ff] font-normal">
            (10 to 5,000 characters)
          </span>
        </label>
        <CharCounter count={charLength} min={10} max={5000} />
      </div>

      <div className="relative">
        <textarea
          id="product-brief-input"
          name="product_brief"
          ref={textareaRef}
          value={brief}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={6}
          autoComplete="off"
          spellCheck={false}
          placeholder={COPY.input.placeholder}
          aria-describedby="brief-char-count"
          className="w-full rounded-[10px] border border-white/20 bg-black/40 p-4 text-base text-white placeholder:text-white/40 focus:border-[#ffe500] focus:ring-1 focus:ring-[#ffe500] transition-colors resize-y min-h-[160px] disabled:opacity-60 disabled:cursor-not-allowed font-sans leading-relaxed"
        />
      </div>

      {/* Sample chips */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#dce4ff]">
          Try a sample pitch:
        </span>
        <div className="flex flex-wrap gap-2">
          {COPY.sampleChips.map((chip) => (
            <SampleChip
              key={chip.label}
              label={chip.label}
              disabled={isLoading}
              onClick={() => handleChipClick(chip.brief)}
            />
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
        <span className="text-xs text-white/60 hidden sm:inline font-mono">
          Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/20 text-[11px] text-white">⌘/Ctrl + Enter</kbd> to run
        </span>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isLoading ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-sm font-bold border border-white/20 hover:bg-white/10 active:scale-[0.98] text-white transition-[transform,background-color] duration-150 ease-out cursor-pointer uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {COPY.input.cancelButton}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValidLength || isLoading}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-wide transition-[transform,background-color,box-shadow] duration-150 ease-out flex items-center justify-center gap-2 ${
              !isValidLength || isLoading
                ? "border-2 border-white/20 bg-transparent text-white/40 cursor-not-allowed shadow-none"
                : "bg-[#ffe500] hover:bg-[#f0d800] hover:-translate-y-0.5 text-black cursor-pointer shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#133ee8]"
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>{COPY.input.runningButton}</span>
              </>
            ) : (
              <span>{COPY.input.runButton}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
