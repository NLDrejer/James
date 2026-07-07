import { expect, test } from "@playwright/test";

test("searches fixture properties and opens the property detail page", async ({ page }) => {
  await page.goto("/search");

  await page.getByLabel("Navn").fill("Søren Ågård");
  await page.getByLabel(/Jeg bekræfter/).check();
  await page.getByRole("button", { name: "Søg" }).click();

  await expect(page.getByText("Havnegade 12")).toBeVisible();
  await expect(page.getByText("Mock Danish Property Fixtures")).toBeVisible();
  await expect(page.getByText("Confidence: high")).toBeVisible();

  const detailLink = page.getByRole("link", { name: "Se ejendom" });
  await expect(detailLink).toHaveAttribute("href", "/properties/mock-property-odense-001");
  await Promise.all([
    page.waitForURL(/\/properties\/mock-property-odense-001$/),
    detailLink.click({ force: true }),
  ]);

  await expect(page.getByRole("heading", { name: "Havnegade 12" })).toBeVisible();
  await expect(page.getByText("Demo Matrikel 12a")).toBeVisible();
});
