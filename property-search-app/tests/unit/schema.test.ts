import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  dataSources,
  ownershipLinks,
  persons,
  properties,
  searchAuditLogs,
} from "@/db/schema";

const columnNames = (table: Parameters<typeof getTableColumns>[0]) =>
  Object.keys(getTableColumns(table));

describe("property search database schema", () => {
  it("models provenance and confidence for every person-property relation", () => {
    expect(columnNames(ownershipLinks)).toEqual(
      expect.arrayContaining([
        "personId",
        "propertyId",
        "sourceId",
        "confidenceLabel",
        "confidenceScore",
        "provenanceNote",
        "sourceRecordId",
        "sourceUrl",
        "retrievedAt",
      ]),
    );
  });

  it("keeps person records minimal and excludes CPR identifiers", () => {
    const personColumns = columnNames(persons);

    expect(personColumns).toEqual(
      expect.arrayContaining(["displayName", "normalizedName", "createdAt", "updatedAt"]),
    );
    expect(personColumns.join(" ").toLowerCase()).not.toContain("cpr");
  });

  it("captures Danish property and source metadata", () => {
    expect(columnNames(properties)).toEqual(
      expect.arrayContaining([
        "addressLine1",
        "normalizedAddress",
        "postalCode",
        "municipality",
        "countryCode",
        "cadastralIdentifier",
        "propertyIdentifier",
      ]),
    );
    expect(columnNames(dataSources)).toEqual(
      expect.arrayContaining([
        "name",
        "sourceType",
        "termsUrl",
        "provenanceNote",
        "allowedUseSummary",
        "liveIntegrationEnabled",
      ]),
    );
  });

  it("audits search metadata without storing raw query text", () => {
    const auditColumns = columnNames(searchAuditLogs);

    expect(auditColumns).toEqual(
      expect.arrayContaining([
        "queryHash",
        "normalizedQueryLength",
        "requesterSessionId",
        "status",
        "resultCount",
        "blockedReason",
        "createdAt",
      ]),
    );
    expect(auditColumns).not.toContain("query");
    expect(auditColumns).not.toContain("rawQuery");
  });
});
