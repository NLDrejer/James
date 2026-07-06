import { mockPropertyProvider } from "./mock-provider";
import type { PropertySearchProvider } from "./types";

const providers = {
  mock: mockPropertyProvider,
} satisfies Record<string, PropertySearchProvider>;

export type PropertyProviderId = keyof typeof providers;

export const getPropertySearchProvider = (providerId: PropertyProviderId = "mock") => providers[providerId];

export const listPropertySearchProviders = () => Object.values(providers);
