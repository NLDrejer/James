import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { createTestDatabase } from "./testing";

type Database = NeonHttpDatabase<typeof schema>;

type TestDatabase = ReturnType<typeof createTestDatabase>;
type DatabaseLike = Database | TestDatabase;

// Lazy initialization: defer JAMES_DATABASE_URL check until runtime
let dbInstance: DatabaseLike | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.JAMES_DATABASE_URL || process.env.DATABASE_URL;
}

function getDb(): DatabaseLike {
  if (!dbInstance) {
    if (process.env.JAMES_TEST_DB === "memory") {
      dbInstance = createTestDatabase() as DatabaseLike;
      return dbInstance;
    }

    // Prefer the James-prefixed variable, but keep DATABASE_URL as a
    // compatibility fallback for Vercel/Neon integrations and older setups.
    const databaseUrl = getDatabaseUrl();

    if (!databaseUrl) {
      throw new Error(
        "JAMES_DATABASE_URL or DATABASE_URL is not set. Add one to your .env.local file or Vercel environment variables."
      );
    }

    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql, { schema }) as unknown as DatabaseLike;
  }
  return dbInstance;
}

export const db = new Proxy({} as DatabaseLike, {
  get: (_target, prop, receiver) => Reflect.get(getDb(), prop, receiver),
  has: (_target, prop) => prop in getDb(),
  ownKeys: () => Reflect.ownKeys(getDb()),
  getOwnPropertyDescriptor: (_target, prop) =>
    Object.getOwnPropertyDescriptor(getDb(), prop),
}) as DatabaseLike;
