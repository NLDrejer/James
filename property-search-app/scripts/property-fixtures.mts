import path from "node:path";
import process from "node:process";

import {
  bundledFixtureDocument,
  importFixtureFile,
  writeFixtureFile,
} from "../src/lib/data-sources/fixture-tooling.ts";

const DEFAULT_FIXTURE_PATH = path.resolve(
  process.cwd(),
  "src/lib/data-sources/fixtures/mock-property-fixtures.json",
);

const usage = `Usage:
  npm run fixtures:export -- [output-path]
  npm run fixtures:import -- <input-path> [output-path]
`;

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command === "export") {
    const outputPath = path.resolve(process.cwd(), args[0] ?? DEFAULT_FIXTURE_PATH);
    await writeFixtureFile(outputPath, bundledFixtureDocument);
    console.log(`Exported property fixtures to ${outputPath}`);
    return;
  }

  if (command === "import") {
    const inputPath = args[0];

    if (!inputPath) {
      throw new Error(`Missing input path.\n\n${usage}`);
    }

    const outputPath = path.resolve(process.cwd(), args[1] ?? DEFAULT_FIXTURE_PATH);
    const importedDocument = await importFixtureFile(path.resolve(process.cwd(), inputPath), outputPath);
    console.log(
      `Imported ${importedDocument.ownershipLinks.length} property ownership link(s) to ${outputPath}`,
    );
    return;
  }

  throw new Error(`Unknown command.\n\n${usage}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
