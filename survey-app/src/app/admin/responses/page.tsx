import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { questions, users } from "@/db/schema";
import { getSessionUsername, isAdminUsername } from "@/lib/session";
import { logout } from "../../actions";

export default async function AdminResponsesPage() {
  const username = await getSessionUsername();
  if (!username) redirect("/");
  if (!isAdminUsername(username)) redirect("/survey");

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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Responses</h1>
            <Link
              href="/admin"
              className="text-sm text-gray-500 underline hover:text-gray-900"
            >
              &larr; Back to admin
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/responses/export"
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Export CSV
            </a>
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
            No questions yet, so there&apos;s nothing to respond to.
          </p>
        ) : respondentUsers.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-500">
            No one has logged in yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 font-medium text-gray-900">
                    User
                  </th>
                  {allQuestions.map((q, i) => (
                    <th
                      key={q.id}
                      className="min-w-[200px] px-4 py-3 font-medium text-gray-900"
                    >
                      {i + 1}. {q.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {respondentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0">
                    <td className="sticky left-0 bg-white px-4 py-3 font-medium text-gray-900">
                      {u.username}
                    </td>
                    {allQuestions.map((q) => (
                      <td key={q.id} className="px-4 py-3 text-gray-700">
                        {answerMap.get(`${u.id}:${q.id}`) ?? (
                          <span className="text-gray-300">&mdash;</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
