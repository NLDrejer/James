export type SourceApprovalStatus = "pending_approval" | "approved" | "blocked";
export type OfficialSourceId = "dar" | "bbr" | "cvr" | "ois" | "tinglysningen";

export type SourceAccessRecord = {
  method: string;
  termsUrl: string;
  authentication: string;
  rateLimitSummary: string;
};

export type SourceApprovalRecord = {
  sourceId: OfficialSourceId;
  sourceName: string;
  status: SourceApprovalStatus;
  sourceAccess: SourceAccessRecord;
  allowedUseSummary: string;
  blockedUseSummary: string;
  legalBasis: string;
  approvalReference: string;
  approvedBy: string;
  approvedAt: string;
  retentionSummary: string;
  personNameLookupAllowed: boolean;
  publicDisplayAllowed: boolean;
  requiredControls: string[];
  productionGateNotes: string;
};

const SOURCE_ENABLE_ENV: Record<OfficialSourceId, string> = {
  dar: "PROPERTY_SEARCH_ENABLE_DAR",
  bbr: "PROPERTY_SEARCH_ENABLE_BBR",
  cvr: "PROPERTY_SEARCH_ENABLE_CVR",
  ois: "PROPERTY_SEARCH_ENABLE_OIS",
  tinglysningen: "PROPERTY_SEARCH_ENABLE_TINGLYSNINGEN",
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

const isEnabledValue = (value: string | undefined) =>
  TRUE_VALUES.has((value ?? "").trim().toLowerCase());

const requiredApprovedFields: Array<keyof SourceApprovalRecord> = [
  "legalBasis",
  "approvalReference",
  "approvedBy",
  "approvedAt",
  "retentionSummary",
  "allowedUseSummary",
  "blockedUseSummary",
  "productionGateNotes",
];

const requiredControls = ["authentication", "audit logging", "rate limiting", "source kill switch"];

const requireNonEmpty = (value: string, fieldName: string) => {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} is required before a source can be approved.`);
  }
};

export function validateSourceApproval(record: SourceApprovalRecord): SourceApprovalRecord {
  requireNonEmpty(record.sourceId, "sourceId");
  requireNonEmpty(record.sourceName, "sourceName");
  requireNonEmpty(record.sourceAccess.method, "sourceAccess.method");
  requireNonEmpty(record.sourceAccess.termsUrl, "sourceAccess.termsUrl");
  requireNonEmpty(record.sourceAccess.authentication, "sourceAccess.authentication");
  requireNonEmpty(record.sourceAccess.rateLimitSummary, "sourceAccess.rateLimitSummary");

  if (record.status !== "approved") {
    return record;
  }

  for (const field of requiredApprovedFields) {
    const value = record[field];
    if (typeof value === "string") {
      requireNonEmpty(value, field);
    }
  }

  const approvalDate = new Date(record.approvedAt);
  if (Number.isNaN(approvalDate.getTime())) {
    throw new Error("approvedAt must be an ISO-8601 date string before a source can be approved.");
  }

  const normalizedControls = record.requiredControls.map((control) => control.trim().toLowerCase());
  for (const control of requiredControls) {
    if (!normalizedControls.includes(control)) {
      throw new Error(`requiredControls must include ${control} before a source can be approved.`);
    }
  }

  return record;
}

export function sourceEnableEnvName(sourceId: OfficialSourceId): string {
  return SOURCE_ENABLE_ENV[sourceId];
}

export function isSourceLiveIntegrationEnabled(
  record: SourceApprovalRecord,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const approval = validateSourceApproval(record);

  if (approval.status !== "approved") {
    return false;
  }

  return (
    isEnabledValue(env.PROPERTY_SEARCH_ENABLE_LIVE_SOURCES) &&
    isEnabledValue(env[sourceEnableEnvName(approval.sourceId)])
  );
}

const pendingSource = (
  sourceId: OfficialSourceId,
  sourceName: string,
  method: string,
  blockedUseSummary: string,
): SourceApprovalRecord => ({
  sourceId,
  sourceName,
  status: "pending_approval",
  sourceAccess: {
    method,
    termsUrl: "TODO: record official terms URL or agreement reference",
    authentication: "TODO: document credential mechanism; never commit secrets",
    rateLimitSummary: "TODO: record provider rate limits before enabling",
  },
  allowedUseSummary: "TODO: record the approved workflow before enabling live data.",
  blockedUseSummary,
  legalBasis: "TODO: record legal basis or agreement reference before approval.",
  approvalReference: "TODO: record contract/ticket/document reference before approval.",
  approvedBy: "TODO",
  approvedAt: "TODO",
  retentionSummary: "TODO: record retention and deletion requirements before approval.",
  personNameLookupAllowed: false,
  publicDisplayAllowed: false,
  requiredControls,
  productionGateNotes: "Pending approval. Keep live integration disabled.",
});

export const candidateSourceApprovals: SourceApprovalRecord[] = [
  pendingSource(
    "dar",
    "DAR / Dataforsyningen",
    "Dataforsyningen/Datafordeler address API or approved export",
    "Do not treat address/base-register records as proof of ownership.",
  ),
  pendingSource(
    "bbr",
    "BBR building register",
    "Datafordeler/Dataforsyningen BBR API or approved export",
    "Do not infer ownership or personal relationships from BBR building facts alone.",
  ),
  pendingSource(
    "cvr",
    "CVR open/company register",
    "CVR API/open-data export under documented terms",
    "Do not infer private residence or private ownership from company data without explicit approval.",
  ),
  pendingSource(
    "ois",
    "OIS.dk",
    "Official OIS access path, API, export, or documented scraping permission",
    "Do not scrape, bulk copy, retain, or expose person-to-property lookup outside the approved workflow.",
  ),
  pendingSource(
    "tinglysningen",
    "Tinglysningen",
    "Official Tinglysningen access path, API, export, or documented scraping permission",
    "Do not build unauthenticated ownership dossiers or copy more rights/owner fields than necessary.",
  ),
];
