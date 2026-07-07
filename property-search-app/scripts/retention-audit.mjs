#!/usr/bin/env node

const args = new Set(process.argv.slice(2));
const mode = args.has("--purge") ? "purge" : "dry-run";

console.log(
  JSON.stringify(
    {
      mode,
      target: "search_audit_logs",
      defaultRetentionDays: 90,
      rawSearchTextStored: false,
      note:
        mode === "purge"
          ? "Database purge hook placeholder: wire to Drizzle delete where created_at is older than the configured cutoff before live sources are enabled."
          : "Dry-run policy check: audit logs older than 90 days are purge candidates; entries contain hashes/metadata only, never raw search text.",
    },
    null,
    2,
  ),
);
