const sourceChecks = [
  "OIS.dk og Tinglysningen må ikke scrapes eller kobles på før vilkår og lovligt grundlag er dokumenteret.",
  "MVP bruger kun mockdata eller eksplicit lovlige importer med tydelig proveniens.",
  "Alle resultater skal vise kilde, hentetidspunkt, formål og confidence — ingen skjulte personopslag.",
];

const sourceCards = [
  {
    name: "OIS.dk",
    status: "Blokeret for live-MVP",
    text: "Kun kandidatkilde. Kræver officiel adgangsmetode, vilkår og afklaring af om navnebaseret opslag er tilladt.",
  },
  {
    name: "Tinglysningen",
    status: "Blokeret for live-MVP",
    text: "Ingen scraping. Eventuel integration kræver dokumenteret adgang, formål, retention og dataminimering.",
  },
  {
    name: "BBR/DAR/CVR/open data",
    status: "Vurderes kilde for kilde",
    text: "Adresse- og virksomhedsdata kan være relevante, men person-til-ejendom-sammenstilling kræver særskilt gate.",
  },
  {
    name: "Brugerimporter",
    status: "MVP-sikker vej",
    text: "Tilladt når datasættet er mock, anonymiseret eller importeret med dokumenteret hjemmel og proveniens.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#1e3a8a,_transparent_36%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#111827_100%)] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
          <div className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
            Dansk-only property search · MVP safe mode
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Ejendomssøgning med lovlighed, proveniens og privatliv først.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Denne app er en ny Next.js-skal til James-repoet. Før live-data
              kobles på, kører produktet i sikker MVP-tilstand med mockdata eller
              eksplicit lovlige importer — og alle fremtidige resultater skal være
              ejendomscentrerede, kildebelagte og auditerbare.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {sourceChecks.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          {sourceCards.map((source) => (
            <article key={source.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">{source.name}</h2>
                <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                  {source.status}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{source.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-blue-300/20 bg-blue-300/10 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-white">Produktionsgate</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-blue-100">
            Live-integrationer forbliver deaktiveret, indtil repoets
            data-source assessment dokumenterer officiel adgang, kildevilkår,
            hjemmel/formål, retention, auditkrav, rate limits og om
            navnebaseret person-til-ejendom-opslag overhovedet er tilladt.
          </p>
        </section>
      </div>
    </main>
  );
}
