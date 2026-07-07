import { describe, expect, it } from "vitest";

import type { SearchAuditEntry } from "@/lib/search/search-audit-log";
import { mockFixtures } from "@/lib/data-sources/mock-provider";
import {
  buildRetentionPlan,
  filterExpiredAuditEntries,
  planImportedDataDeletion,
  PROPERTY_SEARCH_RETENTION_DEFAULTS,
} from "@/lib/retention/retention-policy";

const auditEntry = (createdAt: Date, overrides: Partial<SearchAuditEntry> = {}): SearchAuditEntry => ({
  queryHash: "a".repeat(64),
  normalizedQueryLength: 12,
  requesterSessionId: null,
  requesterIpHash: "b".repeat(64),
  userAgentHash: "c".repeat(64),
  status: "success",
  resultCount: 1,
  blockedReason: null,
  createdAt,
  ...overrides,
});

describe("retention and deletion policy", () => {
  it("defines safe default retention windows before live sources are enabled", () => {
    expect(PROPERTY_SEARCH_RETENTION_DEFAULTS).toEqual({
      auditLogDays: 90,
      lawfulImportDays: 365,
      mockFixtureDays: 0,
    });

    expect(buildRetentionPlan()).toMatchObject({
      auditLogDays: 90,
      liveSourcesEnabled: false,
      rawSearchTextStored: false,
    });
  });

  it("selects expired audit entries without exposing raw query text", () => {
    const now = new Date("2026-07-07T12:00:00.000Z");
    const expired = auditEntry(new Date("2026-03-01T00:00:00.000Z"));
    const recent = auditEntry(new Date("2026-07-01T00:00:00.000Z"), { status: "blocked" });

    const result = filterExpiredAuditEntries([expired, recent], { now, retentionDays: 90 });

    expect(result.expired).toEqual([expired]);
    expect(result.retained).toEqual([recent]);
    expect(JSON.stringify(result).toLowerCase()).not.toContain("søren");
    expect(result.expired[0]?.queryHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("plans imported data deletion by source/import batch while preserving provenance metadata", () => {
    const plan = planImportedDataDeletion(
      {
        sources: [mockFixtures.source],
        persons: mockFixtures.persons,
        properties: mockFixtures.properties,
        ownershipLinks: mockFixtures.ownershipLinks,
      },
      {
        sourceId: "mock-fixtures-2026-07",
        importBatchId: "fixture",
        requestedAt: new Date("2026-07-07T12:00:00.000Z"),
      },
    );

    expect(plan).toMatchObject({
      sourceId: "mock-fixtures-2026-07",
      importBatchId: "fixture",
      sourceRetainedForAudit: {
        id: "mock-fixtures-2026-07",
        name: "Mock Danish Property Fixtures",
        sourceType: "mock",
        liveIntegrationEnabled: false,
      },
      counts: {
        persons: 2,
        properties: 2,
        ownershipLinks: 2,
      },
    });
    expect(plan.deletionOrder).toEqual(["ownershipLinks", "properties", "persons"]);
    expect(plan.sourceRetainedForAudit.provenanceNote).toContain("fake/anonymized");
  });
});
