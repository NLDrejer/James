import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("login, answer the survey, log in as admin, and add a question", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByPlaceholder("Username").fill("sally");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/survey$/);
  await expect(page.getByText("Signed in as sally")).toBeVisible();

  const answerInputs = page.getByPlaceholder("Your answer");
  const totalQuestions = await answerInputs.count();
  expect(totalQuestions).toBeGreaterThanOrEqual(2);

  for (let index = 0; index < totalQuestions; index += 1) {
    await answerInputs.nth(index).fill(`Smoke answer ${index + 1}`);
    await page.getByRole("button", { name: "Save" }).nth(index).click();
  }

  await expect(page.getByText(`${totalQuestions} of ${totalQuestions} answered`)).toBeVisible();
  await expect(page.getByText("Thanks for completing the survey!")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByPlaceholder("Username").fill("admin");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Signed in as admin")).toBeVisible();

  const newQuestion = "How many tickets remain?";
  await page.getByPlaceholder("Question text").fill(newQuestion);
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.locator("input").last()).toHaveValue(newQuestion);
});
