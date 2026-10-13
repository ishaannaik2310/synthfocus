import React from "react";
import { COPY } from "../../lib/copy";

interface BatchProgressBarProps {
  totalBatches: number;
  completedBatches: number;
  currentBatchIndex: number;
  isThrottling: boolean;
  throttleSeconds: number;
}

export function BatchProgressBar({
  totalBatches,
  completedBatches,
  currentBatchIndex,
  isThrottling,
  throttleSeconds,
}: BatchProgressBarProps) {
  const percentComplete = Math.round((completedBatches / totalBatches) * 100);

  return (
    <div
      className="space-y-2.5 my-4"
      role="progressbar"
      aria-valuenow={percentComplete}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Simulation progress: ${completedBatches} of ${totalBatches} batches completed`}
    >
      <div className="flex items-center justify-between text-xs text-ink-subtle">
        <span className="font-medium text-ink">
          {COPY.processing.batchProgressLabel(
            Math.min(completedBatches + 1, totalBatches),
            totalBatches
          )}
        </span>
        <span className="tabular-nums">
          {isThrottling ? (
            <span className="text-warning">
              Rate guard pause ({throttleSeconds}s)
            </span>
          ) : (
            `${percentComplete}%`
          )}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 h-2 w-full">
        {Array.from({ length: totalBatches }).map((_, idx) => {
          const isDone = idx < completedBatches;
          const isRunning = idx === currentBatchIndex && !isThrottling;
          const isPaused = idx === currentBatchIndex && isThrottling;

          let barColor = "bg-white/15";
          if (isDone) {
            barColor = "bg-[#ffe500]";
          } else if (isRunning) {
            barColor = "bg-[#ffe500]/70 animate-pulse";
          } else if (isPaused) {
            barColor = "bg-amber-400/70 animate-pulse";
          }

          return (
            <div
              key={idx}
              className={`h-full rounded-sm transition-[background-color,opacity] duration-300 ease-out ${barColor}`}
              title={`Batch ${idx + 1}: ${
                isDone ? "Done" : isRunning ? "Running" : isPaused ? "Throttled" : "Queued"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
