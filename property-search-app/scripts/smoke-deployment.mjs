#!/usr/bin/env node

const baseUrl = process.env.PROPERTY_SEARCH_DEPLOYMENT_URL || process.argv[2];

if (!baseUrl) {
  console.error("Usage: npm run smoke:deployment -- https://<deployment-url>");
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

const checks = [
  {
    path: "/",
    expectedText: "Ejendomssøgning med lovlighed, proveniens og privatliv først.",
  },
  {
    path: "/search",
    expectedText: "Søg i kildebundne ejendomsrelationer",
  },
  {
    path: "/api/search?q=S%C3%B8ren%20%C3%85g%C3%A5rd",
    expectedStatus: 401,
    expectedText: "unauthorized",
  },
];

for (const check of checks) {
  const url = `${normalizedBaseUrl}${check.path}`;
  const response = await fetch(url, { redirect: "follow" });
  const body = await response.text();
  const expectedStatus = check.expectedStatus ?? 200;

  if (response.status !== expectedStatus) {
    console.error(`${url} returned HTTP ${response.status}; expected ${expectedStatus}`);
    process.exit(1);
  }

  if (!body.includes(check.expectedText)) {
    console.error(`${url} did not include expected text: ${check.expectedText}`);
    process.exit(1);
  }

  console.log(`✓ ${url}`);
}

console.log("Deployment smoke check passed.");
