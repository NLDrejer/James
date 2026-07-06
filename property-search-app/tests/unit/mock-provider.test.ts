import { describe, expect, it } from "vitest";

import { mockPropertyProvider } from "@/lib/data-sources/mock-provider";

const expectSourceMetadata = (result: Awaited<ReturnType<typeof mockPropertyProvider.searchByName>>[number]) => {
  expect(result.source).toMatchObject({
    name: "Mock Danish Property Fixtures",
    sourceType: "mock",
    liveIntegrationEnabled: false,
  });
  expect(result.provenanceNote).toContain("fake");
  expect(result.confidenceLabel).toMatch(/^(high|medium|low|unknown)$/);
  expect(result.retrievedAt).toBeInstanceOf(Date);
};

describe("mock property provider", () => {
  it("searches fake Danish fixtures by normalized name", async () => {
    const results = await mockPropertyProvider.searchByName("Søren Ågård");

    expect(results).toHaveLength(1);
    expect(results[0]?.person.displayName).toBe("Søren Ågård");
    expect(results[0]?.property).toMatchObject({
      addressLine1: "Havnegade 12",
      postalCode: "5000",
      municipality: "Odense",
      countryCode: "DK",
    });
    expectSourceMetadata(results[0]!);
  });

  it("returns no results for empty or too-short queries", async () => {
    await expect(mockPropertyProvider.searchByName("")).resolves.toEqual([]);
    await expect(mockPropertyProvider.searchByName("sø")).resolves.toEqual([]);
  });

  it("can load a property by id with source metadata", async () => {
    const property = await mockPropertyProvider.getProperty("mock-property-odense-001");

    expect(property?.property.addressLine1).toBe("Havnegade 12");
    expect(property?.source.sourceType).toBe("mock");
    expect(property?.links.every((link) => link.source.id === property.source.id)).toBe(true);
  });

  it("does not include CPR numbers or real source claims in fixtures", async () => {
    const results = await mockPropertyProvider.searchByName("a");
    const serialized = JSON.stringify(results).toLowerCase();

    expect(serialized).not.toContain("cpr");
    expect(serialized).not.toContain("tinglysningen");
    expect(serialized).not.toContain("ois.dk");
    expect(results.every((result) => result.source.liveIntegrationEnabled === false)).toBe(true);
  });
});
