# Data-source and compliance assessment

Issue: #32 — Compliance/data-source assessment for OIS.dk, Tinglysningen, and public registers.

## Decision summary

The MVP must run in **safe mode**: mock fixtures or explicitly lawful user-provided
imports only. Live integrations and scraping are disabled until a source-specific
production gate documents official access, source terms, legal basis, retention,
auditability, and whether name-to-property lookup is permitted for the intended
use case.

This document is a product/engineering guardrail, not legal advice. Before
production use with real personal data, get legal review for GDPR, Danish data
protection rules, source-specific terms, and the concrete customer/use case.

## Candidate source matrix

| Source | Candidate data | Official access / terms to verify | MVP allowed use | Blocked until production gate | Provenance note |
| --- | --- | --- | --- | --- | --- |
| OIS.dk | Property and building-related public information | Official OIS access method, terms, authentication, rate limits, reuse/redistribution rights, and whether person/name lookup is allowed | No live integration. Use only mock data that resembles expected fields | Scraping, bulk copying without terms, name-to-property lookup, long-term retention of copied personal data | Store source name, official URL/terms version, retrieval/import time, and field-level confidence before enabling |
| Tinglysningen | Land registration/rights information | Official digital access/API/export options, terms, payment/authentication, allowed purposes, retention, and display restrictions | No live integration. Use fake fixtures or lawful documents supplied by a user with a documented purpose | Scraping, automated person dossiers, public unauthenticated ownership lookup, copying more fields than needed | Keep document/reference IDs and retrieval date; prefer links/references over unnecessary replicated data |
| BBR / DAR / Dataforsyningen | Building/address/base register data | Datafordeler/Dataforsyningen access terms, attribution, API credentials, rate limits, and allowed redistribution | Potentially useful for address/property context after terms review; mock data only for this ticket | Treating address/base-register data as proof of ownership, joining to people without legal basis | Record dataset name, version/API endpoint, import timestamp, and transformation steps |
| CVR/open data | Company identity and business address data | CVR/open-data terms, purpose limitations, refresh requirements, and whether combining with property data is allowed | Company-only enrichment may be considered after terms review; mock data only now | Inferring private residence/ownership from business data without legal basis | Track CVR number/source timestamp for company records; do not imply personal ownership |
| User-provided imports | Customer/imported property lists, contracts, or other lawful datasets | Importer must document origin, authority to process, consent/contract/legal basis, retention, and deletion process | Allowed for MVP if fake, anonymized, or explicitly lawful and marked with provenance | Importing CPR numbers, hidden people-search exports, or datasets with unclear origin | Require import metadata: provider, purpose, lawful basis, retention date, contact, and confidence |

## Production gate for live integrations

A source cannot be enabled unless all of the following are true:

1. **Official access documented** — API/export/manual import path, auth method, cost, rate limits, and terms URL/version are recorded.
2. **Allowed use documented** — the intended search/display workflow is explicitly allowed or approved for the source.
3. **Source approval record completed** — `docs/source-approvals/<source>.md` records approval reference, legal basis, approved-by/date, terms version, rate limits, retention, and credential handling.
4. **Name-to-property check passed** — legal/product review confirms whether a Danish name may be used as a search key and under what access controls.
5. **Privacy controls implemented** — authentication, authorization, audit logging, rate limiting, abuse review, and retention/deletion rules are in place.
6. **Data minimization completed** — only necessary fields are stored; references/source URLs are preferred over copied personal data.
7. **Provenance model implemented** — every result can show source, retrieval/import time, confidence, and why the result appears.
8. **Operational kill switch exists** — a source-level feature flag can disable live data immediately without redeploying schema.
9. **Legal sign-off captured** — reviewer, date, decision, and conditions are recorded in the repo or approved compliance system.

## MVP safe-mode rules

- `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES` defaults to `false`.
- A source-specific switch (`PROPERTY_SEARCH_ENABLE_DAR`, `PROPERTY_SEARCH_ENABLE_BBR`, `PROPERTY_SEARCH_ENABLE_CVR`, `PROPERTY_SEARCH_ENABLE_OIS`, or `PROPERTY_SEARCH_ENABLE_TINGLYSNINGEN`) must also be enabled before any live source can run.
- In Vercel Preview/Production, keep `PROPERTY_SEARCH_ENABLE_LIVE_SOURCES=false`
  until a source-specific production gate is approved.
- In Vercel Preview/Production, set `PROPERTY_SEARCH_REQUIRE_AUTH=true` so any
  real person/property lookup remains access-controlled.
- Mock fixtures must be visibly fake and must not include CPR numbers or real sensitive personal identifiers.
- User-provided imports must include provenance metadata before use.
- UI copy must state that source/provenance/confidence are mandatory and that live official sources are disabled.
- Search features must not be publicly accessible with real personal data until auth, audit logs, and rate limits are implemented.

## Open legal/product questions

- What is the intended lawful basis and user role for person-to-property lookup?
- Is the product for internal/private use, professional due diligence, customer support, or public self-service?
- Which fields are genuinely necessary for the first production workflow?
- How long should imported/source-derived records and audit logs be retained?
- Who reviews abuse reports and source takedown/deletion requests?
