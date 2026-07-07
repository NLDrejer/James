import { normalizeDanishName } from "@/lib/search/normalize-danish-name";

import { bundledFixtureDocument } from "./fixture-tooling";
import type { PropertySearchProvider, PropertyWithLinks } from "./types";

const { source, ownershipLinks, properties } = bundledFixtureDocument;

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

    const normalizedQuery = normalizeDanishName(trimmedQuery);

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

export const mockFixtures = bundledFixtureDocument;
