import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("environment variable compatibility", () => {
  it("uses DATABASE_URL when JAMES_DATABASE_URL is not set", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://legacy-db");
    vi.stubEnv("JAMES_DATABASE_URL", "");

    const { getDatabaseUrl } = await import("@/db");

    expect(getDatabaseUrl()).toBe("postgresql://legacy-db");
  });

  it("prefers JAMES_DATABASE_URL over DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://legacy-db");
    vi.stubEnv("JAMES_DATABASE_URL", "postgresql://james-db");

    const { getDatabaseUrl } = await import("@/db");

    expect(getDatabaseUrl()).toBe("postgresql://james-db");
  });

  it("uses SESSION_SECRET when JAMES_SESSION_SECRET is not set", async () => {
    vi.stubEnv("SESSION_SECRET", "legacy-secret");
    vi.stubEnv("JAMES_SESSION_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");

    const { getSessionSecret } = await import("@/lib/session");

    expect(getSessionSecret()).toBe("legacy-secret");
  });

  it("supports legacy admin username variables", async () => {
    vi.stubEnv("ADMIN_USERNAMES", "nikolaj, admin");
    vi.stubEnv("JAMES_ADMIN_USERNAMES", "");

    const { isAdminUsername } = await import("@/lib/session");

    expect(isAdminUsername("Nikolaj")).toBe(true);
  });
});
