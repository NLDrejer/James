#!/usr/bin/env node

const args = process.argv.slice(2);
const readFlag = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const source = readFlag("--source");
const batch = readFlag("--batch");

if (!source) {
  console.error("Usage: npm run retention:imports:delete -- --source <source-id> [--batch <batch-id>] [--dry-run]");
  process.exit(2);
}

console.log(
  JSON.stringify(
    {
      mode: args.includes("--execute") ? "execute" : "dry-run",
      source,
      importBatchId: batch ?? null,
      deletionOrder: ["ownershipLinks", "properties", "persons"],
      sourceMetadataRetainedForAudit: true,
      note:
        "Deletion must remove imported person/property/link rows while retaining source provenance metadata for auditability. Wire this command to Drizzle deletes before enabling live imports.",
    },
    null,
    2,
  ),
);
