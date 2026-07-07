import type {
  PersonRecord,
  PropertyOwnershipLink,
  PropertyRecord,
  SourceMetadata,
} from "@/lib/data-sources/types";
import type { SearchAuditEntry } from "@/lib/search/search-audit-log";

export const PROPERTY_SEARCH_RETENTION_DEFAULTS = {
  auditLogDays: 90,
  lawfulImportDays: 365,
  mockFixtureDays: 0,
} as const;

export type RetentionPlan = {
  auditLogDays: number;
  lawfulImportDays: number;
  mockFixtureDays: number;
  liveSourcesEnabled: boolean;
  rawSearchTextStored: false;
  manualDeletionCommands: string[];
};

export const buildRetentionPlan = ({
  liveSourcesEnabled = process.env.PROPERTY_SEARCH_ENABLE_LIVE_SOURCES === "true",
  auditLogDays = PROPERTY_SEARCH_RETENTION_DEFAULTS.auditLogDays,
  lawfulImportDays = PROPERTY_SEARCH_RETENTION_DEFAULTS.lawfulImportDays,
  mockFixtureDays = PROPERTY_SEARCH_RETENTION_DEFAULTS.mockFixtureDays,
}: Partial<Omit<RetentionPlan, "rawSearchTextStored" | "manualDeletionCommands">> = {}): RetentionPlan => ({
  auditLogDays,
  lawfulImportDays,
  mockFixtureDays,
  liveSourcesEnabled,
  rawSearchTextStored: false,
  manualDeletionCommands: [
    "npm run retention:audit:dry-run",
    "npm run retention:audit:purge",
    "npm run retention:imports:delete -- --source <source-id> --batch <batch-id>",
  ],
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const filterExpiredAuditEntries = (
  entries: SearchAuditEntry[],
  {
    now = new Date(),
    retentionDays = PROPERTY_SEARCH_RETENTION_DEFAULTS.auditLogDays,
  }: {
    now?: Date;
    retentionDays?: number;
  } = {},
) => {
  const cutoffTime = now.getTime() - retentionDays * MS_PER_DAY;

  return entries.reduce(
    (groups, entry) => {
      if (entry.createdAt.getTime() < cutoffTime) {
        groups.expired.push(entry);
      } else {
        groups.retained.push(entry);
      }

      return groups;
    },
    { expired: [] as SearchAuditEntry[], retained: [] as SearchAuditEntry[] },
  );
};

type ImportedDataSet = {
  sources: SourceMetadata[];
  persons: PersonRecord[];
  properties: PropertyRecord[];
  ownershipLinks: PropertyOwnershipLink[];
};

type DeletionRequest = {
  sourceId: string;
  importBatchId?: string;
  requestedAt?: Date;
};

type SourceAuditSnapshot = Pick<
  SourceMetadata,
  | "id"
  | "name"
  | "sourceType"
  | "provenanceNote"
  | "allowedUseSummary"
  | "blockedUseSummary"
  | "retentionSummary"
  | "termsUrl"
  | "liveIntegrationEnabled"
>;

const isMatchingBatch = (sourceRecordId: string, importBatchId?: string) =>
  !importBatchId || sourceRecordId.includes(importBatchId);

export const planImportedDataDeletion = (
  dataSet: ImportedDataSet,
  { sourceId, importBatchId, requestedAt = new Date() }: DeletionRequest,
) => {
  const source = dataSet.sources.find((candidate) => candidate.id === sourceId);

  if (!source) {
    throw new Error(`Unknown data source: ${sourceId}`);
  }

  const ownershipLinks = dataSet.ownershipLinks.filter(
    (link) => link.source.id === sourceId && isMatchingBatch(link.sourceRecordId, importBatchId),
  );
  const linkedPersonIds = new Set(ownershipLinks.map((link) => link.person.id));
  const linkedPropertyIds = new Set(ownershipLinks.map((link) => link.property.id));
  const persons = dataSet.persons.filter(
    (person) => linkedPersonIds.has(person.id) && isMatchingBatch(person.sourceRecordId, importBatchId),
  );
  const properties = dataSet.properties.filter(
    (property) => linkedPropertyIds.has(property.id) && isMatchingBatch(property.sourceRecordId, importBatchId),
  );

  const sourceRetainedForAudit: SourceAuditSnapshot = {
    id: source.id,
    name: source.name,
    sourceType: source.sourceType,
    provenanceNote: source.provenanceNote,
    allowedUseSummary: source.allowedUseSummary,
    blockedUseSummary: source.blockedUseSummary,
    retentionSummary: source.retentionSummary,
    termsUrl: source.termsUrl,
    liveIntegrationEnabled: source.liveIntegrationEnabled,
  };

  return {
    sourceId,
    importBatchId: importBatchId ?? null,
    requestedAt,
    sourceRetainedForAudit,
    deletionOrder: ["ownershipLinks", "properties", "persons"] as const,
    counts: {
      persons: persons.length,
      properties: properties.length,
      ownershipLinks: ownershipLinks.length,
    },
  };
};
