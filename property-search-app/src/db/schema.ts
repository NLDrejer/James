import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", [
  "mock",
  "official",
  "lawful_import",
]);
export const confidenceLabelEnum = pgEnum("confidence_label", [
  "official",
  "high",
  "medium",
  "low",
  "unknown",
]);
export const ownershipRoleEnum = pgEnum("ownership_role", [
  "owner",
  "co_owner",
  "administrator",
  "unknown",
]);
export const searchAuditStatusEnum = pgEnum("search_audit_status", [
  "success",
  "empty_result",
  "blocked",
  "rate_limited",
  "invalid",
  "error",
]);

export const dataSourceAssessments = pgTable("data_source_assessments", {
  id: serial("id").primaryKey(),
  sourceName: varchar("source_name", { length: 120 }).notNull(),
  officialAccessMethod: text("official_access_method"),
  termsUrl: text("terms_url"),
  provenanceNote: text("provenance_note").notNull(),
  allowedUseSummary: text("allowed_use_summary").notNull(),
  blockedUseSummary: text("blocked_use_summary").notNull(),
  liveIntegrationEnabled: boolean("live_integration_enabled")
    .notNull()
    .default(false),
  assessedAt: timestamp("assessed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dataSources = pgTable(
  "data_sources",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    sourceType: sourceTypeEnum("source_type").notNull().default("mock"),
    officialAccessMethod: text("official_access_method"),
    termsUrl: text("terms_url"),
    provenanceNote: text("provenance_note").notNull(),
    allowedUseSummary: text("allowed_use_summary").notNull(),
    blockedUseSummary: text("blocked_use_summary").notNull(),
    retentionSummary: text("retention_summary"),
    liveIntegrationEnabled: boolean("live_integration_enabled")
      .notNull()
      .default(false),
    assessedAt: timestamp("assessed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("data_sources_name_unique").on(table.name)],
);

export const persons = pgTable(
  "persons",
  {
    id: serial("id").primaryKey(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 160 }).notNull(),
    sourceId: integer("source_id").references(() => dataSources.id, {
      onDelete: "set null",
    }),
    sourceRecordId: varchar("source_record_id", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("persons_source_id_idx").on(table.sourceId)],
);

export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),
    addressLine1: varchar("address_line_1", { length: 220 }).notNull(),
    addressLine2: varchar("address_line_2", { length: 220 }),
    normalizedAddress: varchar("normalized_address", { length: 260 }).notNull(),
    postalCode: varchar("postal_code", { length: 4 }).notNull(),
    municipality: varchar("municipality", { length: 120 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull().default("DK"),
    cadastralIdentifier: varchar("cadastral_identifier", { length: 160 }),
    propertyIdentifier: varchar("property_identifier", { length: 160 }),
    sourceId: integer("source_id").references(() => dataSources.id, {
      onDelete: "set null",
    }),
    sourceRecordId: varchar("source_record_id", { length: 160 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("properties_source_id_idx").on(table.sourceId)],
);

export const ownershipLinks = pgTable(
  "ownership_links",
  {
    id: serial("id").primaryKey(),
    personId: integer("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    sourceId: integer("source_id")
      .notNull()
      .references(() => dataSources.id, { onDelete: "restrict" }),
    ownershipRole: ownershipRoleEnum("ownership_role")
      .notNull()
      .default("unknown"),
    confidenceLabel: confidenceLabelEnum("confidence_label")
      .notNull()
      .default("unknown"),
    confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }),
    provenanceNote: text("provenance_note").notNull(),
    sourceRecordId: varchar("source_record_id", { length: 160 }),
    sourceUrl: text("source_url"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("ownership_links_person_id_idx").on(table.personId),
    index("ownership_links_property_id_idx").on(table.propertyId),
    index("ownership_links_source_id_idx").on(table.sourceId),
    uniqueIndex("ownership_links_identity_unique").on(
      table.personId,
      table.propertyId,
      table.sourceId,
      table.ownershipRole,
    ),
    check(
      "ownership_links_confidence_score_range",
      sql`${table.confidenceScore} IS NULL OR (${table.confidenceScore} >= 0 AND ${table.confidenceScore} <= 1)`,
    ),
  ],
);

export const searchAuditLogs = pgTable("search_audit_logs", {
  id: serial("id").primaryKey(),
  queryHash: varchar("query_hash", { length: 128 }).notNull(),
  normalizedQueryLength: integer("normalized_query_length").notNull(),
  requesterSessionId: varchar("requester_session_id", { length: 128 }),
  requesterIpHash: varchar("requester_ip_hash", { length: 128 }),
  userAgentHash: varchar("user_agent_hash", { length: 128 }),
  status: searchAuditStatusEnum("status").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  blockedReason: text("blocked_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type DataSourceAssessment = typeof dataSourceAssessments.$inferSelect;
export type NewDataSourceAssessment = typeof dataSourceAssessments.$inferInsert;

export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type OwnershipLink = typeof ownershipLinks.$inferSelect;
export type NewOwnershipLink = typeof ownershipLinks.$inferInsert;
export type SearchAuditLog = typeof searchAuditLogs.$inferSelect;
export type NewSearchAuditLog = typeof searchAuditLogs.$inferInsert;
