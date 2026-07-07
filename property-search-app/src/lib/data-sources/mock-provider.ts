import type {
  PersonRecord,
  PropertyRecord,
  PropertySearchProvider,
  PropertyWithLinks,
  SourceMetadata,
  PropertyOwnershipLink,
} from "./types";

const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("da-DK")
    .replace(/å/g, "aa")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const source: SourceMetadata = {
  id: "mock-fixtures-2026-07",
  name: "Mock Danish Property Fixtures",
  sourceType: "mock",
  provenanceNote:
    "Contains deliberately fake/anonymized Danish demo records for local development only.",
  allowedUseSummary: "Local development, demos, and automated tests only.",
  blockedUseSummary:
    "Not official data. Do not use for real ownership decisions, scraping, enrichment, or public claims.",
  retentionSummary: "Fixtures can be deleted at any time and must be replaced by documented lawful imports.",
  liveIntegrationEnabled: false,
  retrievedAt: new Date("2026-07-06T00:00:00.000Z"),
};

const persons: PersonRecord[] = [
  {
    id: "mock-person-soren-agaard",
    displayName: "Søren Ågård",
    normalizedName: normalize("Søren Ågård"),
    sourceRecordId: "fixture-person-001",
  },
  {
    id: "mock-person-aase-oestergaard",
    displayName: "Åse Østergaard",
    normalizedName: normalize("Åse Østergaard"),
    sourceRecordId: "fixture-person-002",
  },
];

const properties: PropertyRecord[] = [
  {
    id: "mock-property-odense-001",
    addressLine1: "Havnegade 12",
    normalizedAddress: normalize("Havnegade 12, 5000 Odense"),
    postalCode: "5000",
    municipality: "Odense",
    countryCode: "DK",
    cadastralIdentifier: "Demo Matrikel 12a",
    propertyIdentifier: "MOCK-DK-ODENSE-001",
    sourceRecordId: "fixture-property-001",
  },
  {
    id: "mock-property-aarhus-001",
    addressLine1: "Bøgelunden 4",
    normalizedAddress: normalize("Bøgelunden 4, 8000 Aarhus C"),
    postalCode: "8000",
    municipality: "Aarhus",
    countryCode: "DK",
    cadastralIdentifier: "Demo Matrikel 4b",
    propertyIdentifier: "MOCK-DK-AARHUS-001",
    sourceRecordId: "fixture-property-002",
  },
];

const ownershipLinks: PropertyOwnershipLink[] = [
  {
    id: "mock-link-soren-odense",
    person: persons[0]!,
    property: properties[0]!,
    source,
    ownershipRole: "owner",
    confidenceLabel: "high",
    confidenceScore: 0.91,
    provenanceNote: "fake fixture link created to validate source/confidence display in the MVP.",
    sourceRecordId: "fixture-link-001",
    retrievedAt: source.retrievedAt,
  },
  {
    id: "mock-link-aase-aarhus",
    person: persons[1]!,
    property: properties[1]!,
    source,
    ownershipRole: "co_owner",
    confidenceLabel: "medium",
    confidenceScore: 0.74,
    provenanceNote: "Fake fixture link created to validate ambiguous Danish-name search behavior.",
    sourceRecordId: "fixture-link-002",
    retrievedAt: source.retrievedAt,
  },
];

export const mockPropertyProvider: PropertySearchProvider = {
  id: "mock-property-provider",

  async getSourceMetadata() {
    return source;
  },

  async searchByName(query: string) {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
      return [];
    }

    const normalizedQuery = normalize(trimmedQuery);

    return ownershipLinks.filter((link) => link.person.normalizedName.includes(normalizedQuery));
  },

  async getProperty(propertyId: string): Promise<PropertyWithLinks | null> {
    const property = properties.find((candidate) => candidate.id === propertyId);

    if (!property) {
      return null;
    }

    return {
      property,
      source,
      links: ownershipLinks.filter((link) => link.property.id === property.id),
    };
  },
};

export const mockFixtures = {
  source,
  persons,
  properties,
  ownershipLinks,
};
