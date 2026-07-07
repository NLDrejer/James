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

  clear() {
    this.entries.splice(0, this.entries.length);
  }
}

export const searchAuditStore = new InMemorySearchAuditStore();
