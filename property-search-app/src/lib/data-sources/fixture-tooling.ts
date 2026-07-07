import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import bundledFixtureJson from "./fixtures/mock-property-fixtures.json" with { type: "json" };
import type {
  PersonRecord,
  PropertyOwnershipLink,
  PropertyRecord,
  SourceMetadata,
} from "./types";

export type FixtureDocument = {
  source: SourceMetadata;
  persons: PersonRecord[];
  properties: PropertyRecord[];
  ownershipLinks: PropertyOwnershipLink[];
};

type SerializedSourceMetadata = Omit<SourceMetadata, "retrievedAt"> & {
  retrievedAt: string;
};

type SerializedPropertyOwnershipLink = Omit<
  PropertyOwnershipLink,
  "source" | "person" | "property" | "retrievedAt"
> & {
  source: SerializedSourceMetadata;
  person: PersonRecord;
  property: PropertyRecord;
  retrievedAt: string;
};

type SerializedFixtureDocument = {
  source: SerializedSourceMetadata;
  persons: PersonRecord[];
  properties: PropertyRecord[];
  ownershipLinks: SerializedPropertyOwnershipLink[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const expectString = (value: unknown, fieldPath: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldPath} must be a non-empty string.`);
  }

  return value;
};

const expectBoolean = (value: unknown, fieldPath: string): boolean => {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldPath} must be a boolean.`);
  }

  return value;
};

const expectDate = (value: unknown, fieldPath: string): Date => {
  const parsed = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;

  if (!parsed || Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldPath} must be an ISO-8601 date string.`);
  }

  return parsed;
};

const expectOptionalString = (value: unknown, fieldPath: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return expectString(value, fieldPath);
};

const parseSourceMetadata = (value: unknown, fieldPath: string): SourceMetadata => {
  if (!isRecord(value)) {
    throw new Error(`${fieldPath} source metadata is required.`);
  }

  return {
    id: expectString(value.id, `${fieldPath}.id`),
    name: expectString(value.name, `${fieldPath}.name`),
    sourceType: expectString(value.sourceType, `${fieldPath}.sourceType`) as SourceMetadata["sourceType"],
    provenanceNote: expectString(value.provenanceNote, `${fieldPath}.provenanceNote`),
    allowedUseSummary: expectString(value.allowedUseSummary, `${fieldPath}.allowedUseSummary`),
    blockedUseSummary: expectString(value.blockedUseSummary, `${fieldPath}.blockedUseSummary`),
    retentionSummary: expectOptionalString(value.retentionSummary, `${fieldPath}.retentionSummary`),
    termsUrl: expectOptionalString(value.termsUrl, `${fieldPath}.termsUrl`),
    liveIntegrationEnabled: expectBoolean(value.liveIntegrationEnabled, `${fieldPath}.liveIntegrationEnabled`),
    retrievedAt: expectDate(value.retrievedAt, `${fieldPath}.retrievedAt`),
  };
};

const parsePersonRecord = (value: unknown, fieldPath: string): PersonRecord => {
  if (!isRecord(value)) {
    throw new Error(`${fieldPath} must be an object.`);
  }

  return {
    id: expectString(value.id, `${fieldPath}.id`),
    displayName: expectString(value.displayName, `${fieldPath}.displayName`),
    normalizedName: expectString(value.normalizedName, `${fieldPath}.normalizedName`),
    sourceRecordId: expectString(value.sourceRecordId, `${fieldPath}.sourceRecordId`),
  };
};

const parsePropertyRecord = (value: unknown, fieldPath: string): PropertyRecord => {
  if (!isRecord(value)) {
    throw new Error(`${fieldPath} must be an object.`);
  }

  return {
    id: expectString(value.id, `${fieldPath}.id`),
    addressLine1: expectString(value.addressLine1, `${fieldPath}.addressLine1`),
    addressLine2: expectOptionalString(value.addressLine2, `${fieldPath}.addressLine2`),
    normalizedAddress: expectString(value.normalizedAddress, `${fieldPath}.normalizedAddress`),
    postalCode: expectString(value.postalCode, `${fieldPath}.postalCode`),
    municipality: expectString(value.municipality, `${fieldPath}.municipality`),
    countryCode: expectString(value.countryCode, `${fieldPath}.countryCode`) as "DK",
    cadastralIdentifier: expectOptionalString(value.cadastralIdentifier, `${fieldPath}.cadastralIdentifier`),
    propertyIdentifier: expectOptionalString(value.propertyIdentifier, `${fieldPath}.propertyIdentifier`),
    sourceRecordId: expectString(value.sourceRecordId, `${fieldPath}.sourceRecordId`),
  };
};

const parseOwnershipLink = (value: unknown, fieldPath: string): PropertyOwnershipLink => {
  if (!isRecord(value)) {
    throw new Error(`${fieldPath} must be an object.`);
  }

  return {
    id: expectString(value.id, `${fieldPath}.id`),
    person: parsePersonRecord(value.person, `${fieldPath}.person`),
    property: parsePropertyRecord(value.property, `${fieldPath}.property`),
    source: parseSourceMetadata(value.source, `${fieldPath}.source metadata`),
    ownershipRole: expectString(value.ownershipRole, `${fieldPath}.ownershipRole`) as PropertyOwnershipLink["ownershipRole"],
    confidenceLabel: expectString(value.confidenceLabel, `${fieldPath}.confidenceLabel`) as PropertyOwnershipLink["confidenceLabel"],
    confidenceScore: typeof value.confidenceScore === "number" ? value.confidenceScore : undefined,
    provenanceNote: expectString(value.provenanceNote, `${fieldPath}.provenanceNote`),
    sourceRecordId: expectString(value.sourceRecordId, `${fieldPath}.sourceRecordId`),
    sourceUrl: expectOptionalString(value.sourceUrl, `${fieldPath}.sourceUrl`),
    retrievedAt: expectDate(value.retrievedAt, `${fieldPath}.retrievedAt`),
  };
};

export const validateFixtureDocument = (value: unknown, fieldPath = "fixture"): FixtureDocument => {
  if (!isRecord(value)) {
    throw new Error(`${fieldPath} must be a JSON object.`);
  }

  const persons = Array.isArray(value.persons)
    ? value.persons.map((person, index) => parsePersonRecord(person, `${fieldPath}.persons[${index}]`))
    : (() => {
        throw new Error(`${fieldPath}.persons must be an array.`);
      })();
  const properties = Array.isArray(value.properties)
    ? value.properties.map((property, index) => parsePropertyRecord(property, `${fieldPath}.properties[${index}]`))
    : (() => {
        throw new Error(`${fieldPath}.properties must be an array.`);
      })();
  const ownershipLinks = Array.isArray(value.ownershipLinks)
    ? value.ownershipLinks.map((link, index) => parseOwnershipLink(link, `${fieldPath}.ownershipLinks[${index}]`))
    : (() => {
        throw new Error(`${fieldPath}.ownershipLinks must be an array.`);
      })();

  return {
    source: parseSourceMetadata(value.source, `${fieldPath}.source`),
    persons,
    properties,
    ownershipLinks,
  };
};

export const bundledFixtureDocument = validateFixtureDocument(bundledFixtureJson, "bundledFixtureDocument");

const serializeFixtureDocument = (document: FixtureDocument): SerializedFixtureDocument => ({
  source: {
    ...document.source,
    retrievedAt: document.source.retrievedAt.toISOString(),
  },
  persons: document.persons,
  properties: document.properties,
  ownershipLinks: document.ownershipLinks.map((link) => ({
    ...link,
    source: {
      ...link.source,
      retrievedAt: link.source.retrievedAt.toISOString(),
    },
    person: link.person,
    property: link.property,
    retrievedAt: link.retrievedAt.toISOString(),
  })),
});

export const writeFixtureFile = async (filePath: string, document: unknown) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
};

export const readFixtureFile = async (filePath: string) => {
  const rawFixture = JSON.parse(await readFile(filePath, "utf8")) as unknown;

  return validateFixtureDocument(rawFixture, `fixture file ${filePath}`);
};

export const importFixtureFile = async (inputPath: string, outputPath: string) => {
  const fixtureDocument = await readFixtureFile(inputPath);

  await writeFixtureFile(outputPath, serializeFixtureDocument(fixtureDocument));

  return fixtureDocument;
};
