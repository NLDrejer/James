import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization: defer DATABASE_URL check until runtime
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. Add it to your .env.local file or Vercel environment variables.");
    }
    const sql = neon(process.env.DATABASE_URL);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

export const db = {
  query: new Proxy({} as any, {
    get: (_target, prop) => {
      return getDb().query[prop];
    },
  }),
} as ReturnType<typeof drizzle>;
