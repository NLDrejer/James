import { redirect } from "next/navigation";
import { getSessionUsername, isAdminUsername } from "@/lib/session";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const username = await getSessionUsername();
  if (username) {
    redirect(isAdminUsername(username) ? "/admin" : "/survey");
  }

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">Welcome</h1>
        <p className="mb-6 text-sm text-gray-500">
          Enter a username to continue.
        </p>

        <form action={login} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            required
            maxLength={64}
            autoFocus
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />

          {error && (
            <p className="text-sm text-red-600">
              Please enter a valid username.
            </p>
          )}

          <button
            type="submit"
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
