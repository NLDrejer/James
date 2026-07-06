import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const dataSourceAssessments = pgTable("data_source_assessments", {
  id: serial("id").primaryKey(),
  sourceName: varchar("source_name", { length: 120 }).notNull(),
  officialAccessMethod: text("official_access_method"),
  termsUrl: text("terms_url"),
  provenanceNote: text("provenance_note").notNull(),
  allowedUseSummary: text("allowed_use_summary").notNull(),
  blockedUseSummary: text("blocked_use_summary").notNull(),
  liveIntegrationEnabled: boolean("live_integration_enabled").notNull().default(false),
  assessedAt: timestamp("assessed_at").defaultNow().notNull(),
});

export type DataSourceAssessment = typeof dataSourceAssessments.$inferSelect;
export type NewDataSourceAssessment = typeof dataSourceAssessments.$inferInsert;
