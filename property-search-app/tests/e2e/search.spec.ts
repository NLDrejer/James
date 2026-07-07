import { expect, test } from "@playwright/test";

test("successful search requires acknowledgement and shows lawful-use context", async ({ page }) => {
  await page.route("**/api/search**", async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ response });
  });

  await page.goto("/search");

  const searchInput = page.getByRole("textbox", { name: /Navn/ });
  const acknowledgeCheckbox = page.getByRole("checkbox", {
    name: /Jeg bekræfter, at dette følsomme opslag er nødvendigt og lovligt/,
  });
  const searchButton = page.getByRole("button", { name: /Søg/i });

  await expect(page.getByRole("heading", { name: /Søg i kildebundne ejendomsrelationer/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/kan være ufuldstændige, kildespecifikke og tvetydige/)).toBeVisible();
  await expect(searchInput).toBeVisible();
  await expect(searchButton).toBeDisabled();

  await searchInput.fill("Søren Ågård");
  await acknowledgeCheckbox.check();
  await expect(searchButton).toBeEnabled();

  await searchButton.click();

  await expect(page.getByText("Søger i den aktive datakilde…")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Mulige match fra kildebundne data/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Søren Ågård")).toBeVisible();
  await expect(page.getByText("Havnegade 12")).toBeVisible();
  await expect(page.getByText("Mock Danish Property Fixtures")).toBeVisible();
  await expect(page.getByText(/ikke identitetsbevis/).first()).toBeVisible();
  await expect(page.getByText(/Bekræftet ejer/)).toHaveCount(0);
});

test("search shows an empty state when the active source returns no match", async ({ page }) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: /Navn/ }).fill("Mette Holm");
  await page
    .getByRole("checkbox", {
      name: /Jeg bekræfter, at dette følsomme opslag er nødvendigt og lovligt/,
    })
    .check();
  await page.getByRole("button", { name: /Søg/i }).click();

  await expect(page.getByRole("heading", { name: /Ingen match i den aktive kilde/ })).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(/Fravær af match betyder ikke, at personen ikke har relation til en ejendom/),
  ).toBeVisible();
});
