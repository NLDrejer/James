import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "property_search_session";

export function getSessionSecret(): string {
  const secret =
    process.env.PROPERTY_SEARCH_SESSION_SECRET || process.env.SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PROPERTY_SEARCH_SESSION_SECRET or SESSION_SECRET must be set in production"
    );
  }

  return "dev-secret-change-me";
}

function sign(value: string): string {
  const hmac = crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

export async function setSessionUsername(username: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSessionUsername(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

function getAdminUsernames(): string[] {
  const list =
    process.env.PROPERTY_SEARCH_ADMIN_USERNAMES || process.env.ADMIN_USERNAMES;
  if (list && list.trim()) {
    return list.split(",").map((u) => u.trim().toLowerCase()).filter(Boolean);
  }

  const single =
    process.env.PROPERTY_SEARCH_ADMIN_USERNAME || process.env.ADMIN_USERNAME || "admin";
  return [single.toLowerCase()];
}

export function isAdminUsername(username: string): boolean {
  return getAdminUsernames().includes(username.toLowerCase());
}
