import type { ConfidenceLabel, PropertyWithLinks } from "@/lib/data-sources/types";

import { SourceBadge } from "./source-badge";

const displayValue = (value?: string) => (value && value.trim() ? value : "Ukendt");

const primaryConfidence = (propertyWithLinks: PropertyWithLinks): ConfidenceLabel => {
  return propertyWithLinks.links[0]?.confidenceLabel ?? "unknown";
};

export function PropertyDetailView({ propertyWithLinks }: { propertyWithLinks: PropertyWithLinks }) {
  const { property, source, links } = propertyWithLinks;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-slate-100 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-4">
        <SourceBadge confidenceLabel={primaryConfidence(propertyWithLinks)} source={source} />
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">{property.addressLine1}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Ejendomsdetaljer vises med tydelig kilde/proveniens. Felter uden dokumenteret værdi står som Ukendt.
          </p>
        </div>
        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <dt className="text-slate-400">Adresse</dt>
            <dd className="mt-1 text-lg font-medium">{displayValue(property.addressLine1)}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <dt className="text-slate-400">Kommune</dt>
            <dd className="mt-1 text-lg font-medium">{displayValue(property.municipality)}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <dt className="text-slate-400">Matrikel</dt>
            <dd className="mt-1 text-lg font-medium">{displayValue(property.cadastralIdentifier)}</dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <dt className="text-slate-400">Ejendoms-id</dt>
            <dd className="mt-1 text-lg font-medium">{displayValue(property.propertyIdentifier)}</dd>
          </div>
        </dl>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-300">
          <p className="font-semibold text-white">Relationer</p>
          {links.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {links.map((link) => (
                <li key={link.id}>
                  {link.person.displayName} · {link.ownershipRole} · confidence {link.confidenceLabel}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">Unknown relation</p>
          )}
        </div>
      </div>
    </section>
  );
}
