"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, questions, answers } from "@/db/schema";
import {
  setSessionUsername,
  getSessionUsername,
  clearSession,
  isAdminUsername,
} from "@/lib/session";

export async function login(formData: FormData) {
  const usernameRaw = formData.get("username");
  const username = typeof usernameRaw === "string" ? usernameRaw.trim() : "";

  if (!username || username.length > 64) {
    redirect("/?error=invalid");
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

export async function deleteQuestion(questionId: number) {
  const username = await getSessionUsername();
  if (!username || !isAdminUsername(username)) redirect("/");

  await db.delete(questions).where(eq(questions.id, questionId));

  revalidatePath("/admin");
  revalidatePath("/survey");
}
