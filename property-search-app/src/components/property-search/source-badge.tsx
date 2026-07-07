import type { ConfidenceLabel, SourceMetadata } from "@/lib/data-sources/types";

const relationTone = (sourceType: SourceMetadata["sourceType"], confidenceLabel: ConfidenceLabel) => {
  if (sourceType === "official" || confidenceLabel === "official") {
    return "Official data";
  }

  if (confidenceLabel === "unknown") {
    return "Unknown relation";
  }

  return "Inferred link";
};

export function SourceBadge({
  confidenceLabel,
  source,
}: {
  confidenceLabel: ConfidenceLabel;
  source: SourceMetadata;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
      <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 font-medium text-sky-100">
        {relationTone(source.sourceType, confidenceLabel)}
      </span>
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Kilde: {source.name}</span>
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
        Confidence: {confidenceLabel}
      </span>
    </div>
  );
}
