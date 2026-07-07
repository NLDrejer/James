import crypto from "node:crypto";

import { expect, test, type BrowserContext } from "@playwright/test";

const COOKIE_NAME = "property_search_session";
const SESSION_SECRET = "test-secret";

const signedSession = (username: string) => {
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(username).digest("hex");
  return `${username}.${signature}`;
};

const setSessionCookie = async (context: BrowserContext, username: string) => {
  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: signedSession(username),
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
};

test("admin audit page requires an admin session", async ({ context, page }) => {
  await page.goto("/admin/audit");
  await expect(page).toHaveURL(/\/search$/);

  await setSessionCookie(context, "analyst");
  await page.goto("/admin/audit");
  await expect(page).toHaveURL(/\/search$/);
});

test("admin audit page lists recent searches without exposing raw query text", async ({ context, page, request }) => {
  const seederCookie = `${COOKIE_NAME}=${encodeURIComponent(signedSession("audit-seeder"))}`;

  await request.get("/api/search?q=S%C3%B8ren%20%C3%85g%C3%A5rd", {
    headers: { cookie: seederCookie },
  });
  await request.get("/api/search?q=Hans", {
    headers: { cookie: seederCookie },
  });

  await setSessionCookie(context, "admin");
  await page.goto("/admin/audit");

  await expect(page.getByRole("heading", { name: "Auditlog for søgebrug" })).toBeVisible();
  await expect(page.getByText("success").first()).toBeVisible();
  await expect(page.getByText("Requester/session")).toBeVisible();
  await expect(page.getByText("audit-seeder").first()).toBeVisible();
  await expect(page.getByText("Query hash")).toBeVisible();
  await expect(page.getByText("IP hash")).toBeVisible();
  await expect(page.getByText("Søren Ågård")).toHaveCount(0);
  await expect(page.getByText("Hans", { exact: true })).toHaveCount(0);
});
