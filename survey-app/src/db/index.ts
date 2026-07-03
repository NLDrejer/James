import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { createTestDatabase } from "./testing";

type Database = ReturnType<typeof drizzle<typeof schema>>;

type DatabaseLike = Database & ReturnType<typeof createTestDatabase>;

// Lazy initialization: defer JAMES_DATABASE_URL check until runtime
let dbInstance: DatabaseLike | null = null;

function getDb(): DatabaseLike {
  if (!dbInstance) {
    if (process.env.JAMES_TEST_DB === "memory") {
      dbInstance = createTestDatabase() as DatabaseLike;
      return dbInstance;
    }

    // Use JAMES_DATABASE_URL (with prefix for Vercel environment)
    const databaseUrl = process.env.JAMES_DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "JAMES_DATABASE_URL is not set. Add it to your .env.local file or Vercel environment variables."
      );
    }

    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql, { schema }) as DatabaseLike;
  }
  return dbInstance;
}

const queryProxy = new Proxy({} as DatabaseLike["query"], {
  get: (_target, prop: keyof DatabaseLike["query"]) => getDb().query[prop],
});

export const db = new Proxy({} as DatabaseLike, {
  get: (_target, prop: keyof DatabaseLike) =>
    prop === "query" ? queryProxy : getDb()[prop],
}) as DatabaseLike;
