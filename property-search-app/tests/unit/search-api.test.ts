import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { GET } from "@/app/api/search/route";
import { resetSearchApiRateLimit } from "@/lib/search/rate-limit";
import { searchAuditStore } from "@/lib/search/search-audit-log";
import { createSignedSessionUsername } from "@/lib/session";

const requestSearch = (query: string, ip = "203.0.113.10", cookie?: string) =>
  GET(
    new Request(`https://property-search.test/api/search?q=${encodeURIComponent(query)}`, {
      headers: {
        ...(cookie ? { cookie } : {}),
        "x-forwarded-for": ip,
        "user-agent": "vitest-search-api",
      },
    }),
  );

describe("GET /api/search", () => {
  beforeEach(() => {
    resetSearchApiRateLimit();
    searchAuditStore.clear();
    vi.stubEnv("PROPERTY_SEARCH_REQUIRE_AUTH", "");
    vi.stubEnv("PROPERTY_SEARCH_SESSION_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires an authenticated session when production protection is enabled", async () => {
    vi.stubEnv("PROPERTY_SEARCH_REQUIRE_AUTH", "true");

    const response = await requestSearch("Søren Ågård");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      status: "unauthorized",
      message: "Authentication is required for property search.",
      results: [],
    });
    expect(searchAuditStore.entries).toEqual([]);
  });

  it("allows authenticated search when production protection is enabled", async () => {
    vi.stubEnv("PROPERTY_SEARCH_REQUIRE_AUTH", "true");
    const cookie = `property_search_session=${createSignedSessionUsername("nikolaj")}`;

    const response = await requestSearch("Søren Ågård", "203.0.113.21", cookie);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "success",
      normalizedQuery: "soeren aagaard",
    });
    expect(searchAuditStore.entries[0]).toMatchObject({
      requesterSessionId: "nikolaj",
      status: "success",
    });
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
