"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, questions, answers } from "@/db/schema";
import {
  setSessionUsername,
  getSessionUsername,
  clearSession,
  isAdminUsername,
} from "@/lib/session";

const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const LOGIN_ATTEMPT_WINDOW_MS = 60_000;
const MAX_LOGIN_ATTEMPTS_PER_WINDOW = 10;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
let lastLoginAttemptCleanup = 0;

function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

async function getLoginAttemptKey(username: string): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    forwardedFor ||
    headerStore.get("x-real-ip") ||
    headerStore.get("cf-connecting-ip") ||
    "unknown";
  return `${ip}:${username.toLowerCase()}`;
}

function cleanupExpiredLoginAttempts(now: number) {
  if (now - lastLoginAttemptCleanup < LOGIN_ATTEMPT_WINDOW_MS) return;

  lastLoginAttemptCleanup = now;
  for (const [key, attempt] of loginAttempts) {
    if (attempt.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  cleanupExpiredLoginAttempts(now);

  const existing = loginAttempts.get(key);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_ATTEMPT_WINDOW_MS });
    return false;
  }

  existing.count += 1;
  return existing.count > MAX_LOGIN_ATTEMPTS_PER_WINDOW;
}

export async function login(formData: FormData) {
  const usernameRaw = formData.get("username");
  const username = typeof usernameRaw === "string" ? usernameRaw.trim() : "";

  if (!isValidUsername(username)) {
    redirect("/?error=invalid");
  }

  if (isRateLimited(await getLoginAttemptKey(username))) {
    redirect("/?error=rate_limited");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!existing) {
    await db.insert(users).values({ username }).onConflictDoNothing();
  }

  await setSessionUsername(username);

  if (isAdminUsername(username)) {
    redirect("/admin");
  }
  redirect("/survey");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function submitAnswer(questionId: number, formData: FormData) {
  const username = await getSessionUsername();
  if (!username) redirect("/");

  const answerText = formData.get("answer");
  if (typeof answerText !== "string" || !answerText.trim()) {
    return;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username!),
  });
  if (!user) redirect("/");

  const existing = await db.query.answers.findFirst({
    where: and(eq(answers.userId, user!.id), eq(answers.questionId, questionId)),
  });

  if (existing) {
    await db
      .update(answers)
      .set({ answerText: answerText.trim() })
      .where(eq(answers.id, existing.id));
  } else {
    await db.insert(answers).values({
      userId: user!.id,
      questionId,
      answerText: answerText.trim(),
    });
  }

  revalidatePath("/survey");
}

export async function addQuestion(formData: FormData) {
  const username = await getSessionUsername();
  if (!username || !isAdminUsername(username)) redirect("/");

  const text = formData.get("text");
  if (typeof text !== "string" || !text.trim()) return;

  const last = await db.query.questions.findMany({
    orderBy: (q, { desc }) => [desc(q.order)],
    limit: 1,
  });
  const nextOrder = (last[0]?.order ?? 0) + 1;

  await db.insert(questions).values({ text: text.trim(), order: nextOrder });

  revalidatePath("/admin");
  revalidatePath("/survey");
}

export async function updateQuestionText(questionId: number, formData: FormData) {
  const username = await getSessionUsername();
  if (!username || !isAdminUsername(username)) redirect("/");

  const text = formData.get("text");
  if (typeof text !== "string" || !text.trim()) return;

  await db
    .update(questions)
    .set({ text: text.trim() })
    .where(eq(questions.id, questionId));

  revalidatePath("/admin");
  revalidatePath("/survey");
}

export async function moveQuestion(questionId: number, direction: "up" | "down") {
  const username = await getSessionUsername();
  if (!username || !isAdminUsername(username)) redirect("/");

  const allQuestions = await db.query.questions.findMany({
    orderBy: (q, { asc }) => [asc(q.order)],
  });

  const index = allQuestions.findIndex((q) => q.id === questionId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= allQuestions.length) return;

  const current = allQuestions[index];
  const swapWith = allQuestions[swapIndex];

  // Swap their `order` values.
  await db
    .update(questions)
    .set({ order: swapWith.order })
    .where(eq(questions.id, current.id));
  await db
    .update(questions)
    .set({ order: current.order })
    .where(eq(questions.id, swapWith.id));

  revalidatePath("/admin");
  revalidatePath("/survey");
}

export async function deleteQuestion(questionId: number) {
  const username = await getSessionUsername();
  if (!username || !isAdminUsername(username)) redirect("/");

  await db.delete(questions).where(eq(questions.id, questionId));

  revalidatePath("/admin");
  revalidatePath("/survey");
}
