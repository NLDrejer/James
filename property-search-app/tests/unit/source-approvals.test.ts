import { describe, expect, it, vi } from "vitest";

import {
  candidateSourceApprovals,
  isSourceLiveIntegrationEnabled,
  validateSourceApproval,
  type SourceApprovalRecord,
} from "@/lib/data-sources/source-approvals";

const approvedDarRecord: SourceApprovalRecord = {
  sourceId: "dar",
  sourceName: "DAR / Dataforsyningen",
  status: "approved",
  sourceAccess: {
    method: "Dataforsyningen API",
    termsUrl: "https://dataforsyningen.dk/",
    authentication: "API key stored outside the repo",
    rateLimitSummary: "Use provider-published limits",
  },
  allowedUseSummary: "Address normalization for authenticated property-search users.",
  blockedUseSummary: "Do not treat address records as proof of ownership.",
  legalBasis: "Official agreement and authenticated API access granted for this workflow.",
  approvalReference: "agreement-dar-2026-07",
  approvedBy: "Nikolaj",
  approvedAt: "2026-07-07T00:00:00.000Z",
  retentionSummary: "Refresh from source and purge stale derived records within 365 days.",
  personNameLookupAllowed: false,
  publicDisplayAllowed: false,
  requiredControls: ["authentication", "audit logging", "rate limiting", "source kill switch"],
  productionGateNotes: "Enable only behind source-specific feature flag after credentials are configured.",
};

describe("source approval production gates", () => {
  it("rejects approved sources without legal approval evidence", () => {
    expect(() =>
      validateSourceApproval({
        ...approvedDarRecord,
        approvalReference: "",
      }),
    ).toThrow(/approvalReference/);
  });

  it("accepts approved source records with access, retention, and controls documented", () => {
    const approval = validateSourceApproval(approvedDarRecord);

    expect(approval.status).toBe("approved");
    expect(approval.requiredControls).toEqual(
      expect.arrayContaining(["authentication", "audit logging", "rate limiting"]),
    );
  });

  it("keeps live integrations disabled unless global and source-specific gates are enabled", () => {
    vi.stubEnv("PROPERTY_SEARCH_ENABLE_LIVE_SOURCES", "true");
    vi.stubEnv("PROPERTY_SEARCH_ENABLE_DAR", "");

    expect(isSourceLiveIntegrationEnabled(approvedDarRecord, process.env)).toBe(false);

    vi.stubEnv("PROPERTY_SEARCH_ENABLE_DAR", "true");

    expect(isSourceLiveIntegrationEnabled(approvedDarRecord, process.env)).toBe(true);
    vi.unstubAllEnvs();
  });

  it("tracks the initial official source candidates as pending and not live-enabled", () => {
    expect(candidateSourceApprovals.map((source) => source.sourceId)).toEqual([
      "dar",
      "bbr",
      "cvr",
      "ois",
      "tinglysningen",
    ]);
    expect(candidateSourceApprovals.every((source) => source.status === "pending_approval")).toBe(true);
    expect(candidateSourceApprovals.every((source) => !isSourceLiveIntegrationEnabled(source))).toBe(true);
  });
});
