"use client";

import { useEffect, useMemo, useState } from "react";

import { SearchResults } from "@/components/property-search/search-results";

import {
  getSearchFeedback,
  hasStoredSensitiveSearchAcknowledgement,
  SENSITIVE_SEARCH_ACKNOWLEDGEMENT_KEY,
  type SearchApiResponse,
  validateSensitiveSearchQuery,
} from "./search-ux";

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "network_error" }
  | { kind: "response"; response: SearchApiResponse };

const panelToneClasses: Record<NonNullable<ReturnType<typeof getSearchFeedback>>["tone"], string> = {
  neutral: "border-blue-300/30 bg-blue-300/10 text-blue-50",
  success: "border-emerald-300/30 bg-emerald-300/10 text-emerald-50",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-50",
  danger: "border-rose-300/30 bg-rose-300/10 text-rose-50",
};

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [state, setState] = useState<SearchState>({ kind: "idle" });

  useEffect(() => {
    queueMicrotask(() => {
      setAcknowledged(
        hasStoredSensitiveSearchAcknowledgement(window.localStorage.getItem(SENSITIVE_SEARCH_ACKNOWLEDGEMENT_KEY)),
      );
    });
  }, []);

  const feedback = useMemo(() => getSearchFeedback(state), [state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateSensitiveSearchQuery(query);
    if (!validation.isValid) {
      setValidationMessage(validation.message);
      setState({ kind: "idle" });
      return;
    }

    if (!acknowledged) {
      setValidationMessage("Bekræft lovligt og nødvendigt formål før første følsomme søgning.");
      return;
    }

    setValidationMessage(null);
    setState({ kind: "loading" });

    try {
      window.localStorage.setItem(SENSITIVE_SEARCH_ACKNOWLEDGEMENT_KEY, "acknowledged");
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json()) as SearchApiResponse;
      setState({ kind: "response", response: payload });
    } catch {
      setState({ kind: "network_error" });
    }
  };

  const results = state.kind === "response" ? state.response.results : [];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Lawful-use search UX · MVP safe mode</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Søg i kildebundne ejendomsrelationer</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Resultater kan være ufuldstændige, kildespecifikke og tvetydige. Brug dem kun som spor til manuel
            verifikation — aldrig som identitetsbevis eller offentlig udpegning.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">
              Hver visning skal angive kilde, hentetidspunkt og hvorfor relationen kun er et muligt match.
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">
              Fravær af match betyder ikke, at der ikke findes en relation i andre eller senere kilder.
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">
              Søg kun efter et nødvendigt, lovligt formål og undgå brede eller serieprægede personopslag.
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="search-query" className="block text-sm font-medium text-slate-200">
                Navn
              </label>
              <input
                id="search-query"
                name="search-query"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-base text-white outline-none ring-0 placeholder:text-slate-500"
                placeholder="Fx Søren Ågård"
                autoComplete="off"
              />
              <p className="mt-2 text-sm text-slate-400">Brug et konkret navn. Søgefeltet accepterer ikke tomme eller meget korte opslag.</p>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950"
              />
              <span>
                Jeg bekræfter, at dette følsomme opslag er nødvendigt og lovligt, og at produktion kræver denne anerkendelse før første søgning.
              </span>
            </label>

            {validationMessage ? (
              <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                {validationMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!acknowledged || state.kind === "loading"}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
              >
                {state.kind === "loading" ? "Søger…" : "Søg"}
              </button>
              <p className="text-sm text-slate-400">Denne demo bruger kun mockdata med dokumenteret proveniens og ingen live-opslag.</p>
            </div>
          </form>
        </section>

        {feedback ? (
          <section className={`rounded-3xl border p-6 ${panelToneClasses[feedback.tone]}`} aria-live="polite">
            <h2 className="text-2xl font-semibold">{feedback.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7">{feedback.body}</p>
          </section>
        ) : null}

        {results.length > 0 ? <SearchResults query={query.trim()} results={results} /> : null}
      </div>
    </main>
  );
}
