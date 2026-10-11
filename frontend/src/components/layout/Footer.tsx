import React from "react";
import { COPY } from "../../lib/copy";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline bg-surface-1 py-8 px-4 sm:px-8 text-center">
      <div className="max-w-4xl mx-auto space-y-2">
        <p className="text-xs sm:text-sm font-medium text-ink-subtle">
          {COPY.footer.disclaimer}
        </p>
        <p className="text-xs text-ink-tertiary">
          {COPY.footer.secondaryNote}
        </p>
      </div>
    </footer>
  );
}
