import React from "react";
import { PersonaEvaluation } from "../../types/simulation";
import { PersonaCard } from "./PersonaCard";
import { PersonaCardSkeleton } from "../processing/PersonaCardSkeleton";
import { COPY } from "../../lib/copy";

interface PersonaGridProps {
  personas: PersonaEvaluation[];
  totalExpected?: number;
  isLoading?: boolean;
}

export function PersonaGrid({
  personas,
  totalExpected = 10,
  isLoading = false,
}: PersonaGridProps) {
  const remainingCount = Math.max(0, totalExpected - personas.length);

  return (
    <section className="space-y-4 my-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 className="text-base sm:text-lg font-semibold text-ink">
          {COPY.results.gridHeading}
        </h2>
        <span className="text-xs text-ink-subtle tabular-nums">
          {personas.length} of {totalExpected} Evaluated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas.map((persona) => (
          <PersonaCard key={persona.persona_id} persona={persona} />
        ))}
        {isLoading && <PersonaCardSkeleton count={remainingCount} />}
      </div>
    </section>
  );
}
