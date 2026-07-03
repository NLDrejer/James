import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

// Lazy initialization: defer JAMES_DATABASE_URL check until runtime
let dbInstance: Database | null = null;

function getDb(): Database {
  if (!dbInstance) {
    // Use JAMES_DATABASE_URL (with prefix for Vercel environment)
    const databaseUrl = process.env.JAMES_DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "JAMES_DATABASE_URL is not set. Add it to your .env.local file or Vercel environment variables."
      );
    }

    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

const queryProxy = new Proxy({} as Database["query"], {
  get: (_target, prop: keyof Database["query"]) => getDb().query[prop],
});

export const db = new Proxy({} as Database, {
  get: (_target, prop: keyof Database) =>
    prop === "query" ? queryProxy : getDb()[prop],
}) as Database;
