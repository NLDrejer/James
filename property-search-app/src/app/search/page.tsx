import Link from "next/link";

export default function SearchPlaceholderPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Søgning er ikke aktiveret endnu</p>
        <h1 className="mt-3 text-3xl font-semibold">MVP safe mode</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Navnebaseret ejendomssøgning åbnes først, når der findes en lovlig
          datakilde, rate limiting, auditlog og tydelig kilde/proveniens på alle
          resultater.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">
          Tilbage til overblik
        </Link>
      </div>
    </main>
  );
}
