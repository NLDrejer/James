import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  bundledFixtureDocument,
  importFixtureFile,
  writeFixtureFile,
} from "@/lib/data-sources/fixture-tooling";

describe("property fixture tooling", () => {
  it("loads the bundled Danish demo fixture with source metadata on every record", () => {
    expect(bundledFixtureDocument.source).toMatchObject({
      name: "Mock Danish Property Fixtures",
      sourceType: "mock",
      liveIntegrationEnabled: false,
    });

    expect(bundledFixtureDocument.persons).not.toHaveLength(0);
    expect(bundledFixtureDocument.properties).not.toHaveLength(0);
    expect(bundledFixtureDocument.ownershipLinks).not.toHaveLength(0);

    for (const link of bundledFixtureDocument.ownershipLinks) {
      expect(link.source).toMatchObject({
        id: bundledFixtureDocument.source.id,
        name: bundledFixtureDocument.source.name,
      });
      expect(link.provenanceNote.toLowerCase()).toContain("fake");
      expect(link.retrievedAt).toBeInstanceOf(Date);
    }
  });

  it("rejects imports when a record is missing source metadata", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "fixture-import-"));
    const inputPath = path.join(tempDir, "missing-source.json");

    await writeFixtureFile(inputPath, {
      ...bundledFixtureDocument,
      ownershipLinks: bundledFixtureDocument.ownershipLinks.map((link, index) =>
        index === 0 ? { ...link, source: undefined } : link,
      ),
    });

    await expect(importFixtureFile(inputPath, path.join(tempDir, "out.json"))).rejects.toThrow(
      /source metadata/i,
    );
  });

  it("imports and exports canonical fixture json for later lawful replacement", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "fixture-roundtrip-"));
    const exportedPath = path.join(tempDir, "fixtures.json");
    const importedPath = path.join(tempDir, "fixtures-imported.json");

    await writeFixtureFile(exportedPath, bundledFixtureDocument);
    await importFixtureFile(exportedPath, importedPath);

    const importedJson = JSON.parse(await readFile(importedPath, "utf8")) as {
      source: { sourceType: string; retrievedAt: string };
      ownershipLinks: Array<{ source: { name: string }; retrievedAt: string }>;
    };

    expect(importedJson.source.sourceType).toBe("mock");
    expect(importedJson.source.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(importedJson.ownershipLinks[0]?.source.name).toBe("Mock Danish Property Fixtures");
    expect(importedJson.ownershipLinks[0]?.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
