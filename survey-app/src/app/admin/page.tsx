import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { getSessionUsername, isAdminUsername } from "@/lib/session";
import { addQuestion, deleteQuestion, logout } from "../actions";

export default async function AdminPage() {
  const username = await getSessionUsername();
  if (!username) redirect("/");
  if (!isAdminUsername(username)) redirect("/survey");

  const allQuestions = await db.query.questions.findMany({
    orderBy: asc(questions.order),
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Signed in as {username}</span>
            <form action={logout}>
              <button className="text-sm text-gray-500 underline hover:text-gray-900">
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-gray-900">
            Add a question
          </h2>
          <form action={addQuestion} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              name="text"
              placeholder="Question text"
              required
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
            <button
              type="submit"
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Add
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2">
          {allQuestions.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              No questions yet. Add one above.
            </p>
          ) : (
            allQuestions.map((q, i) => (
              <div
                key={q.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <span className="text-sm text-gray-900">
                  {i + 1}. {q.text}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await deleteQuestion(q.id);
                  }}
                >
                  <button className="text-sm text-red-600 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
