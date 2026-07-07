# Property fixture tooling

Issue #41 adds a safe import/export path for the property-search MVP's demo data.
The default fixture file is:

- `src/lib/data-sources/fixtures/mock-property-fixtures.json`

## What the fixture file must contain

Every fixture document must include:

- top-level `source` metadata describing provenance, allowed use, blocked use, and retrieval time
- fake or anonymized `persons` and `properties`
- `ownershipLinks` where **each record repeats its own `source` metadata** and `retrievedAt`

Imports are rejected if any record is missing source metadata.

## Export the current demo fixture

```bash
npm run fixtures:export
```

Optional custom output path:

```bash
npm run fixtures:export -- ./tmp/property-fixtures.json
```

## Import a reviewed fixture file

```bash
npm run fixtures:import -- ./path/to/reviewed-fixtures.json
```

Optional custom output path:

```bash
npm run fixtures:import -- ./path/to/reviewed-fixtures.json ./tmp/imported-fixtures.json
```

The import command validates source metadata before writing canonical JSON.

## Replacing demo fixtures with lawful imports later

When replacing the fake fixtures with lawful data later, do all of the following first:

1. Confirm the dataset is fake, anonymized, or explicitly lawful for this workflow.
2. Record provenance, allowed use, blocked use, retention, and retrieval/import time in the fixture `source` metadata.
3. Ensure every imported ownership link keeps its own source metadata and `retrievedAt` value.
4. Review `docs/data-source-assessment.md` and keep live official sources disabled until the production gate is satisfied.
5. Avoid CPR numbers or unnecessary personal identifiers entirely.

Until those conditions are met, keep using the bundled demo fixture only.
