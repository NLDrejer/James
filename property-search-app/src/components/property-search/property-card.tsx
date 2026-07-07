import Link from "next/link";

import type { PropertySearchResult } from "@/lib/search/search-service";

import { SourceBadge } from "./source-badge";

const displayValue = (value?: string) => (value && value.trim() ? value : "Ukendt");

export function PropertyCard({ result }: { result: PropertySearchResult }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-100 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4">
        <SourceBadge confidenceLabel={result.confidenceLabel} source={result.source} />
        <div>
          <h2 className="text-2xl font-semibold">{result.property.addressLine1}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{result.matchExplanation}</p>
        </div>
        <dl className="grid gap-3 text-sm text-slate-200 md:grid-cols-2">
          <div>
            <dt className="text-slate-400">Kommune</dt>
            <dd>{displayValue(result.property.municipality)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Adresse</dt>
            <dd>{displayValue(`${result.property.postalCode} ${result.property.municipality}`.trim())}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Matrikel</dt>
            <dd>{displayValue(result.property.cadastralIdentifier)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Ejendoms-id</dt>
            <dd>{displayValue(result.property.propertyIdentifier)}</dd>
          </div>
        </dl>
        <Link
          href={`/properties/${result.property.id}`}
          className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Se ejendom
        </Link>
      </div>
    </article>
  );
}
