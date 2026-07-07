import { createHash } from "node:crypto";

import type { SearchResultStatus } from "./search-service";

export type SearchApiAuditStatus = SearchResultStatus | "rate_limited" | "error";

export type SearchAuditEntry = {
  queryHash: string;
  normalizedQueryLength: number;
  requesterSessionId: string | null;
  requesterIpHash: string | null;
  userAgentHash: string | null;
  status: SearchApiAuditStatus;
  resultCount: number;
  blockedReason: string | null;
  createdAt: Date;
};

const hashValue = (value: string | null | undefined) =>
  value ? createHash("sha256").update(value).digest("hex") : null;

export const createSearchAuditEntry = ({
  query,
  normalizedQuery,
  requesterSessionId,
  requesterIp,
  userAgent,
  status,
  resultCount,
  blockedReason,
}: {
  query: string;
  normalizedQuery: string;
  requesterSessionId?: string | null;
  requesterIp?: string | null;
  userAgent?: string | null;
  status: SearchApiAuditStatus;
  resultCount: number;
  blockedReason?: string | null;
}): SearchAuditEntry => ({
  queryHash: createHash("sha256").update(query.trim().toLocaleLowerCase("da-DK")).digest("hex"),
  normalizedQueryLength: normalizedQuery.length,
  requesterSessionId: requesterSessionId ?? null,
  requesterIpHash: hashValue(requesterIp),
  userAgentHash: hashValue(userAgent),
  status,
  resultCount,
  blockedReason: blockedReason ?? null,
  createdAt: new Date(),
});

class InMemorySearchAuditStore {
  readonly entries: SearchAuditEntry[] = [];

  record(entry: SearchAuditEntry) {
    this.entries.push(entry);
  }

  listRecent(limit = 50): SearchAuditEntry[] {
    return [...this.entries]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  clear() {
    this.entries.splice(0, this.entries.length);
  }
}

declare global {
  // Keep the in-memory MVP audit sink shared across Next route/page bundles in dev/test.
  // Production can replace this boundary with a durable database-backed implementation.
  var __propertySearchAuditStore: InMemorySearchAuditStore | undefined;
}

export const searchAuditStore =
  globalThis.__propertySearchAuditStore ?? new InMemorySearchAuditStore();

globalThis.__propertySearchAuditStore = searchAuditStore;
