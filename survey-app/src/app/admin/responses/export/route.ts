import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { questions, users } from "@/db/schema";
import { getSessionUsername, isAdminUsername } from "@/lib/session";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username || !isAdminUsername(username)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allQuestions = await db.query.questions.findMany({
    orderBy: asc(questions.order),
  });
  const allUsers = await db.query.users.findMany({
    orderBy: asc(users.username),
  });
  const allAnswers = await db.query.answers.findMany();

  const answerMap = new Map<string, string>();
  for (const a of allAnswers) {
    answerMap.set(`${a.userId}:${a.questionId}`, a.answerText);
  }

  const respondentUsers = allUsers.filter((u) => !isAdminUsername(u.username));

  const header = ["user", ...allQuestions.map((q) => q.text)];
  const rows = respondentUsers.map((u) => [
    u.username,
    ...allQuestions.map((q) => answerMap.get(`${u.id}:${q.id}`) ?? ""),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="survey-responses.csv"',
    },
  });
}
