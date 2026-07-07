export type DataSourceType = "mock" | "official" | "lawful_import";
export type ConfidenceLabel = "official" | "high" | "medium" | "low" | "unknown";
export type OwnershipRole = "owner" | "co_owner" | "administrator" | "unknown";

export type SourceMetadata = {
  id: string;
  name: string;
  sourceType: DataSourceType;
  provenanceNote: string;
  allowedUseSummary: string;
  blockedUseSummary: string;
  retentionSummary?: string;
  termsUrl?: string;
  liveIntegrationEnabled: boolean;
  retrievedAt: Date;
};

export type PersonRecord = {
  id: string;
  displayName: string;
  normalizedName: string;
  sourceRecordId: string;
};

export type PropertyRecord = {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  normalizedAddress: string;
  postalCode: string;
  municipality: string;
  countryCode: "DK";
  cadastralIdentifier?: string;
  propertyIdentifier?: string;
  sourceRecordId: string;
};

export type PropertyOwnershipLink = {
  id: string;
  person: PersonRecord;
  property: PropertyRecord;
  source: SourceMetadata;
  ownershipRole: OwnershipRole;
  confidenceLabel: Exclude<ConfidenceLabel, "official">;
  confidenceScore?: number;
  provenanceNote: string;
  sourceRecordId: string;
  sourceUrl?: string;
  retrievedAt: Date;
};

export type PropertyWithLinks = {
  property: PropertyRecord;
  source: SourceMetadata;
  links: PropertyOwnershipLink[];
};

export type PropertySearchProvider = {
  id: string;
  getSourceMetadata: () => Promise<SourceMetadata>;
  searchByName: (query: string) => Promise<PropertyOwnershipLink[]>;
  getProperty: (propertyId: string) => Promise<PropertyWithLinks | null>;
};
