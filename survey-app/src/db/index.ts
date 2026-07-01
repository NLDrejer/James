import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your .env.local file.");
}

// Standard Postgres wire-protocol connection (node-postgres). Works against
// local Docker Postgres, Neon, and Vercel Postgres alike since Neon supports
// plain TCP connections in addition to its HTTP driver.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL.includes("localhost") ||
    process.env.DATABASE_URL.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
