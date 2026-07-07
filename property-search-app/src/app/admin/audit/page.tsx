export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";

import { searchAuditStore, type SearchAuditEntry } from "@/lib/search/search-audit-log";
import { getSessionUsername, isAdminUsername } from "@/lib/session";

const statusClasses: Record<SearchAuditEntry["status"], string> = {
  success: "border-emerald-300/30 bg-emerald-300/10 text-emerald-50",
  empty_result: "border-slate-300/30 bg-slate-300/10 text-slate-100",
  invalid: "border-amber-300/30 bg-amber-300/10 text-amber-50",
  blocked: "border-amber-300/30 bg-amber-300/10 text-amber-50",
  rate_limited: "border-rose-300/30 bg-rose-300/10 text-rose-50",
  error: "border-rose-300/30 bg-rose-300/10 text-rose-50",
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("da-DK", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(date);

const shortHash = (hash: string | null) => (hash ? `${hash.slice(0, 12)}…` : "—");

export default async function PropertySearchAuditPage() {
  const username = await getSessionUsername();
  if (!username) redirect("/search");
  if (!isAdminUsername(username)) redirect("/search");

  const entries = searchAuditStore.listRecent(100);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
                Property search admin
              </p>
              <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Auditlog for søgebrug</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Viser de seneste søgeforsøg, rate-limit hændelser og blokerede opslag uden at eksponere rå
                søgetekst, IP-adresser eller user-agent værdier.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">
              Logget ind som <span className="font-semibold text-white">{username}</span>
              <br />
              <Link href="/search" className="text-emerald-200 underline hover:text-emerald-100">
                Tilbage til søgning
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Seneste hændelser</h2>
              <p className="mt-2 text-sm text-slate-400">
                Hashes bruges som korrelations-id’er. Rå personnavne og tekniske identifikatorer gemmes ikke.
              </p>
            </div>
            <p className="text-sm text-slate-400">{entries.length} hændelser vist</p>
          </div>

          {entries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 p-8 text-sm text-slate-400">
              Ingen søgehændelser er registreret endnu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Tidspunkt (UTC)</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Resultater</th>
                    <th className="px-3 py-2">Requester/session</th>
                    <th className="px-3 py-2">Query hash</th>
                    <th className="px-3 py-2">IP hash</th>
                    <th className="px-3 py-2">Blokeringsårsag</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={`${entry.queryHash}-${entry.createdAt.toISOString()}`} className="bg-slate-900/80">
                      <td className="rounded-l-2xl px-3 py-3 text-slate-300">{formatDate(entry.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[entry.status]}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{entry.resultCount}</td>
                      <td className="px-3 py-3 text-slate-300">{entry.requesterSessionId ?? "anonymous"}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">{shortHash(entry.queryHash)}</td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">{shortHash(entry.requesterIpHash)}</td>
                      <td className="rounded-r-2xl px-3 py-3 text-slate-300">{entry.blockedReason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
