import type { PropertySearchResult, SearchRejectionReason, SearchResultStatus } from "@/lib/search/search-service";

export const SENSITIVE_SEARCH_ACKNOWLEDGEMENT_KEY = "property-search-sensitive-ack";

export type SearchApiResponse = {
  status: SearchResultStatus | "rate_limited" | "unauthorized";
  normalizedQuery: string;
  reason?: SearchRejectionReason;
  results: PropertySearchResult[];
  message?: string;
};

export type SearchFeedback = {
  tone: "neutral" | "success" | "warning" | "danger";
  title: string;
  body: string;
};

export const validateSensitiveSearchQuery = (query: string) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      isValid: false as const,
      message: "Indtast et navn, før du søger.",
    };
  }

  if (trimmedQuery.length < 3) {
    return {
      isValid: false as const,
      message: "Indtast mindst 3 tegn for at begrænse opslaget.",
    };
  }

  return { isValid: true as const };
};

export const hasStoredSensitiveSearchAcknowledgement = (value: string | null) => value === "acknowledged";

const blockedReasonMessage = (reason?: SearchRejectionReason) => {
  if (reason === "bulk_lookup_pattern" || reason === "suspicious_high_volume_query") {
    return "Denne søgning ligner masseopslag. Brug et enkelt, mere præcist navn.";
  }

  return "Denne søgning er for bred eller risikerer masseopslag. Brug et mere præcist navn.";
};

export const getSearchFeedback = (
  state:
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "network_error" }
    | { kind: "response"; response: SearchApiResponse },
): SearchFeedback | null => {
  if (state.kind === "idle") {
    return null;
  }

  if (state.kind === "loading") {
    return {
      tone: "neutral",
      title: "Søgning i gang",
      body: "Søger i den aktive datakilde…",
    };
  }

  if (state.kind === "network_error") {
    return {
      tone: "danger",
      title: "Søgningen kunne ikke gennemføres",
      body: "Der opstod en teknisk fejl. Prøv igen og bekræft svarene mod den oprindelige kilde.",
    };
  }

  if (state.response.status === "success") {
    const count = state.response.results.length;
    return {
      tone: "success",
      title: "Mulige match fra kildebundne data",
      body: `Viser ${count} muligt match. Resultaterne kan være ufuldstændige eller tvetydige og er ikke identitetsbevis.`,
    };
  }

  if (state.response.status === "empty_result") {
    return {
      tone: "neutral",
      title: "Ingen match i den aktive kilde",
      body: "Ingen resultater blev fundet. Fravær af match betyder ikke, at personen ikke har relation til en ejendom.",
    };
  }

  if (state.response.status === "invalid") {
    return {
      tone: "warning",
      title: "Søgningen skal præciseres",
      body: "Navnet var for kort eller tomt. Tilføj mere præcision, før du søger igen.",
    };
  }

  if (state.response.status === "blocked") {
    return {
      tone: "warning",
      title: "Søgningen blev afvist",
      body: blockedReasonMessage(state.response.reason),
    };
  }

  if (state.response.status === "rate_limited") {
    return {
      tone: "warning",
      title: "For mange opslag på kort tid",
      body: "Vent lidt, før du prøver igen. Begræns opslag til et konkret, nødvendigt formål.",
    };
  }

  return {
    tone: "danger",
    title: "Søgningen kræver yderligere adgang",
    body: state.response.message || "Denne søgning kræver en godkendt session og et dokumenteret formål.",
  };
};
