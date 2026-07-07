import type { PropertySearchResult } from "@/lib/search/search-service";

import { PropertyCard } from "./property-card";

export function SearchResults({ query, results }: { query: string; results: PropertySearchResult[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-slate-100">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Søgeresultater</p>
          <h2 className="text-2xl font-semibold">{results.length} ejendom{results.length === 1 ? "" : "me"} for “{query}”</h2>
        </div>
        <p className="text-sm text-slate-300">Alle resultater viser kilde og confidence. Manglende felter markeres som Ukendt.</p>
      </div>
      <div className="mt-6 grid gap-4">
        {results.map((result) => (
          <PropertyCard key={result.id} result={result} />
        ))}
      </div>
    </section>
  );
}
