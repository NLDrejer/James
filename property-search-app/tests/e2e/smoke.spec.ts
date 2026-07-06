import { expect, test } from "@playwright/test";

test("landing page explains safe MVP mode and data-source gates", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /Ejendomssøgning/ })).toBeVisible();
  await expect(page.getByText("MVP safe mode")).toBeVisible();
  await expect(page.getByText("OIS.dk", { exact: true })).toBeVisible();
  await expect(page.getByText("Tinglysningen", { exact: true })).toBeVisible();
  await expect(page.getByText(/Live-integrationer forbliver deaktiveret/)).toBeVisible();
});
