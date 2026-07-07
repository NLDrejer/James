import { describe, expect, it, beforeEach } from "vitest";

import { GET } from "@/app/api/search/route";
import { resetSearchApiRateLimit } from "@/lib/search/rate-limit";
import { searchAuditStore } from "@/lib/search/search-audit-log";

const requestSearch = (query: string, ip = "203.0.113.10") =>
  GET(
    new Request(`https://property-search.test/api/search?q=${encodeURIComponent(query)}`, {
      headers: {
        "x-forwarded-for": ip,
        "user-agent": "vitest-search-api",
      },
    }),
  );

describe("GET /api/search", () => {
  beforeEach(() => {
    resetSearchApiRateLimit();
    searchAuditStore.clear();
  });

  it("returns 400 for invalid queries and writes a privacy-preserving audit entry", async () => {
    const response = await requestSearch("sø");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      status: "invalid",
      reason: "too_short",
      results: [],
    });
    expect(body.query).toBeUndefined();
    expect(searchAuditStore.entries).toHaveLength(1);
    expect(searchAuditStore.entries[0]).toMatchObject({
      status: "invalid",
      resultCount: 0,
      blockedReason: "too_short",
      normalizedQueryLength: 3,
    });
    expect(searchAuditStore.entries[0]?.queryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(searchAuditStore.entries[0]).toLowerCase()).not.toContain("sø");
  });

  it("returns typed property results with provenance for valid Danish-name searches", async () => {
    const response = await requestSearch("Søren Ågård");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "success",
      normalizedQuery: "soeren aagaard",
    });
    expect(body.query).toBeUndefined();
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toMatchObject({
      ambiguityLabel: "possible_match",
      source: {
        sourceType: "mock",
        liveIntegrationEnabled: false,
      },
      property: {
        countryCode: "DK",
        municipality: "Odense",
      },
    });
    expect(searchAuditStore.entries[0]).toMatchObject({
      status: "success",
      resultCount: 1,
      blockedReason: null,
    });
  });

  it("returns 429 and audits rate-limited callers", async () => {
    await requestSearch("Søren Ågård", "203.0.113.77");
    await requestSearch("Søren Ågård", "203.0.113.77");
    await requestSearch("Søren Ågård", "203.0.113.77");

    const response = await requestSearch("Søren Ågård", "203.0.113.77");
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toMatchObject({
      status: "rate_limited",
      results: [],
    });
    expect(searchAuditStore.entries.at(-1)).toMatchObject({
      status: "rate_limited",
      resultCount: 0,
      blockedReason: "rate_limit_exceeded",
    });
  });
});
