import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { createTestDatabase } from "./testing";

type Database = NeonHttpDatabase<typeof schema>;
type TestDatabase = ReturnType<typeof createTestDatabase>;
type DatabaseLike = Database | TestDatabase;

let dbInstance: DatabaseLike | null = null;

export function getDatabaseUrl(): string | undefined {
  return process.env.PROPERTY_SEARCH_DATABASE_URL || process.env.DATABASE_URL;
}

function getDb(): DatabaseLike {
  if (!dbInstance) {
    if (process.env.PROPERTY_SEARCH_TEST_DB === "memory") {
      dbInstance = createTestDatabase();
      return dbInstance;
    }

    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      throw new Error(
        "PROPERTY_SEARCH_DATABASE_URL or DATABASE_URL is not set. Add one to .env.local or Vercel environment variables."
      );
    }

    const sql = neon(databaseUrl);
    const database: Database = drizzle(sql, { schema });
    dbInstance = database;
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
