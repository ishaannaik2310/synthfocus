import React from "react";
import { COPY } from "../../lib/copy";

export function AppShell() {
  return (
    <header className="h-14 border-b border-hairline bg-canvas/80 backdrop-blur sticky top-0 z-50 flex items-center px-4 sm:px-8 justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="font-semibold text-base tracking-tight text-ink font-sans">
            {COPY.nav.brand}
          </span>
        </div>
        <span className="hidden sm:inline-block text-xs text-ink-subtle px-2 py-0.5 rounded border border-hairline bg-surface-1">
          {COPY.nav.tagline}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-0.5 rounded border border-hairline bg-surface-1 text-ink-muted">
          {COPY.nav.badge}
        </span>
      </div>
    </header>
  );
}
