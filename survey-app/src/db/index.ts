import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy initialization: defer JAMES_DATABASE_URL check until runtime
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    // Use JAMES_DATABASE_URL (with prefix for Vercel environment)
    const databaseUrl = process.env.JAMES_DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error("JAMES_DATABASE_URL is not set. Add it to your .env.local file or Vercel environment variables.");
    }
    
    const sql = neon(databaseUrl);
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
