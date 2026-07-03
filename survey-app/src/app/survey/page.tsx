export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { questions, answers, users } from "@/db/schema";
import { getSessionUsername, isAdminUsername } from "@/lib/session";
import { submitAnswer, logout } from "../actions";

export default async function SurveyPage() {
  const username = await getSessionUsername();
  if (!username) redirect("/");
  if (isAdminUsername(username)) redirect("/admin");

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user) redirect("/");

  const allQuestions = await db.query.questions.findMany({
    orderBy: asc(questions.order),
  });

  const userAnswers = await db.query.answers.findMany({
    where: eq(answers.userId, user.id),
  });
  const answerMap = new Map(userAnswers.map((a) => [a.questionId, a.answerText]));

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Survey</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Signed in as {username}</span>
            <form action={logout}>
              <button className="text-sm text-gray-500 underline hover:text-gray-900">
                Log out
              </button>
            </form>
          </div>
        </div>

        {allQuestions.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-500">
            No questions yet. Check back later.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {allQuestions.map((q, i) => (
              <div
                key={q.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="mb-3 text-sm font-medium text-gray-900">
                  {i + 1}. {q.text}
                </p>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await submitAnswer(q.id, formData);
                  }}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <input
                    type="text"
                    name="answer"
                    defaultValue={answerMap.get(q.id) ?? ""}
                    placeholder="Your answer"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    Save
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
