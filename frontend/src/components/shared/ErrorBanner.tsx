import React from "react";
import { SimulationErrorState } from "../../types/simulation";
import { COPY } from "../../lib/copy";

interface ErrorBannerProps {
  error: SimulationErrorState;
  onRetry: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  const retryLabel =
    error.type === "busy"
      ? error.isAfterCancel
        ? COPY.errors.busyAfterCancel.retryButton
        : COPY.errors.busy.retryButton
      : error.type === "daily_cap"
      ? COPY.errors.dailyCap.retryButton
      : error.type === "rate_limit"
      ? COPY.errors.rateLimit.retryButton
      : error.type === "network"
      ? COPY.errors.network.retryButton
      : error.type === "disconnect"
      ? COPY.errors.disconnect.retryButton
      : COPY.errors.unknown.retryButton;

  return (
    <div
      role="alert"
      className="border-2 border-[#d95d39] bg-[#0e2cb3] p-5 text-white shadow-xl my-4 rounded-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#d95d39] animate-pulse rounded-full" />
            <h3 className="font-bold text-base text-white">
              {error.title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#dce4ff] leading-relaxed pl-4.5">
            {error.message}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase bg-[#ffe500] hover:bg-[#f0d800] text-black transition-colors cursor-pointer"
          >
            {retryLabel}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
