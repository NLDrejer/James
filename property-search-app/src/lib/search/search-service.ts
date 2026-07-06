import type { PropertyOwnershipLink, PropertySearchProvider } from "@/lib/data-sources/types";

import { normalizeDanishName } from "./normalize-danish-name";

export type SearchRejectionReason =
  | "empty_query"
  | "too_short"
  | "overly_broad_query"
  | "bulk_lookup_pattern"
  | "suspicious_high_volume_query";

export type SearchResultStatus = "success" | "empty_result" | "invalid" | "blocked";
export type AmbiguityLabel = "possible_match" | "ambiguous_name";

export type PropertySearchResult = PropertyOwnershipLink & {
  ambiguityLabel: AmbiguityLabel;
  matchExplanation: string;
};

export type PropertySearchResponse = {
  status: SearchResultStatus;
  query: string;
  normalizedQuery: string;
  reason?: SearchRejectionReason;
  results: PropertySearchResult[];
};

const COMMON_BROAD_DANISH_NAMES = new Set([
  "andersen",
  "hansen",
  "jensen",
  "nielsen",
  "pedersen",
  "petersen",
  "christensen",
  "soerensen",
  "rasmussen",
]);

const isBulkLookupPattern = (query: string) => /[,;\n\t]/.test(query);

const isSuspiciousHighVolumeQuery = (normalizedQuery: string) => {
  const tokens = normalizedQuery.split(" ").filter(Boolean);

  return tokens.length > 4 || normalizedQuery.length > 80;
};

const toSearchResult = (link: PropertyOwnershipLink): PropertySearchResult => ({
  ...link,
  ambiguityLabel: link.confidenceLabel === "high" ? "possible_match" : "ambiguous_name",
  matchExplanation:
    "Navnet matcher en fake/anonymiseret kildepost; relationen er ikke identitetsbevis.",
});

export const searchPropertiesByName = async ({
  query,
  provider,
}: {
  query: string;
  provider: PropertySearchProvider;
}): Promise<PropertySearchResponse> => {
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeDanishName(trimmedQuery);

  if (!trimmedQuery) {
    return { status: "invalid", query, normalizedQuery, reason: "empty_query", results: [] };
  }

  if (trimmedQuery.length < 3) {
    return { status: "invalid", query, normalizedQuery, reason: "too_short", results: [] };
  }

  if (isBulkLookupPattern(trimmedQuery)) {
    return { status: "blocked", query, normalizedQuery, reason: "bulk_lookup_pattern", results: [] };
  }

  if (COMMON_BROAD_DANISH_NAMES.has(normalizedQuery)) {
    return { status: "blocked", query, normalizedQuery, reason: "overly_broad_query", results: [] };
  }

  if (isSuspiciousHighVolumeQuery(normalizedQuery)) {
    return {
      status: "blocked",
      query,
      normalizedQuery,
      reason: "suspicious_high_volume_query",
      results: [],
    };
  }

  const providerResults = await provider.searchByName(trimmedQuery);
  const danishOnlyResults = providerResults.filter((result) => result.property.countryCode === "DK");

  if (danishOnlyResults.length === 0) {
    return { status: "empty_result", query, normalizedQuery, results: [] };
  }

  return {
    status: "success",
    query,
    normalizedQuery,
    results: danishOnlyResults.map(toSearchResult),
  };
};
