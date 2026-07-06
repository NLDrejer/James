import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("property-search environment variable compatibility", () => {
  it("uses DATABASE_URL when PROPERTY_SEARCH_DATABASE_URL is not set", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://legacy-db");
    vi.stubEnv("PROPERTY_SEARCH_DATABASE_URL", "");

    const { getDatabaseUrl } = await import("@/db");

    expect(getDatabaseUrl()).toBe("postgresql://legacy-db");
  });

  it("prefers PROPERTY_SEARCH_DATABASE_URL over DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://legacy-db");
    vi.stubEnv("PROPERTY_SEARCH_DATABASE_URL", "postgresql://property-db");

    const { getDatabaseUrl } = await import("@/db");

    expect(getDatabaseUrl()).toBe("postgresql://property-db");
  });

  it("uses SESSION_SECRET when PROPERTY_SEARCH_SESSION_SECRET is not set", async () => {
    vi.stubEnv("SESSION_SECRET", "legacy-secret");
    vi.stubEnv("PROPERTY_SEARCH_SESSION_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");

    const { getSessionSecret } = await import("@/lib/session");

    expect(getSessionSecret()).toBe("legacy-secret");
  });

  it("supports property-search admin username variables", async () => {
    vi.stubEnv("PROPERTY_SEARCH_ADMIN_USERNAMES", "nikolaj, admin");

    const { isAdminUsername } = await import("@/lib/session");

    expect(isAdminUsername("Nikolaj")).toBe(true);
  });
});
