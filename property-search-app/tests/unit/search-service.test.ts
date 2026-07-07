import { describe, expect, it } from "vitest";

import { mockPropertyProvider } from "@/lib/data-sources/mock-provider";
import { searchPropertiesByName } from "@/lib/search/search-service";

describe("property search service", () => {
  it("rejects empty, short, broad, and suspicious high-volume queries", async () => {
    await expect(searchPropertiesByName({ query: "", provider: mockPropertyProvider })).resolves.toMatchObject({
      status: "invalid",
      results: [],
      reason: "empty_query",
    });
    await expect(searchPropertiesByName({ query: "Sø", provider: mockPropertyProvider })).resolves.toMatchObject({
      status: "invalid",
      results: [],
      reason: "too_short",
    });
    await expect(searchPropertiesByName({ query: "Andersen", provider: mockPropertyProvider })).resolves.toMatchObject({
      status: "blocked",
      results: [],
      reason: "overly_broad_query",
    });
    await expect(searchPropertiesByName({ query: "Søren, Åse, Niels", provider: mockPropertyProvider })).resolves.toMatchObject({
      status: "blocked",
      results: [],
      reason: "bulk_lookup_pattern",
    });
    await expect(
      searchPropertiesByName({ query: "Søren Åse Niels Hansen Petersen", provider: mockPropertyProvider }),
    ).resolves.toMatchObject({
      status: "blocked",
      results: [],
      reason: "overly_broad_query",
    });
    await expect(
      searchPropertiesByName({ query: "Søren Åse Niels Peter Lars", provider: mockPropertyProvider }),
    ).resolves.toMatchObject({
      status: "blocked",
      results: [],
      reason: "suspicious_high_volume_query",
    });
  });

  it("returns Danish-only results with provenance, confidence, and no certainty language", async () => {
    const response = await searchPropertiesByName({ query: "Søren Ågård", provider: mockPropertyProvider });

    expect(response.status).toBe("success");
    expect(response.normalizedQuery).toBe("soeren aagaard");
    expect(response.results).toHaveLength(1);
    expect(response.results[0]).toMatchObject({
      matchExplanation: "Navnet matcher en kildepost; relationen er ikke identitetsbevis.",
      confidenceLabel: "high",
      source: {
        sourceType: "mock",
        liveIntegrationEnabled: false,
      },
      property: {
        countryCode: "DK",
      },
    });
    expect(JSON.stringify(response).toLowerCase()).not.toContain("confirmed owner");
    expect(JSON.stringify(response).toLowerCase()).not.toContain("identity certain");
  });

  it("labels ambiguous Danish-name matches without implying identity certainty", async () => {
    const response = await searchPropertiesByName({ query: "Åse Østergaard", provider: mockPropertyProvider });

    expect(response.status).toBe("success");
    expect(response.results[0]?.confidenceLabel).toBe("medium");
    expect(response.results[0]?.ambiguityLabel).toBe("ambiguous_name");
    expect(response.results[0]?.matchExplanation).toContain("ikke identitetsbevis");
  });
});
