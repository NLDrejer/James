import { describe, expect, it } from "vitest";

import {
  getSearchFeedback,
  hasStoredSensitiveSearchAcknowledgement,
  validateSensitiveSearchQuery,
} from "@/app/search/search-ux";

describe("search UX helpers", () => {
  it("validates empty and too-short sensitive search queries", () => {
    expect(validateSensitiveSearchQuery("")).toEqual({
      isValid: false,
      message: "Indtast et navn, før du søger.",
    });

    expect(validateSensitiveSearchQuery("sø")).toEqual({
      isValid: false,
      message: "Indtast mindst 3 tegn for at begrænse opslaget.",
    });

    expect(validateSensitiveSearchQuery("Søren Ågård")).toEqual({
      isValid: true,
    });
  });

  it("maps API responses to privacy-safe feedback copy", () => {
    expect(
      getSearchFeedback({
        kind: "response",
        response: { status: "success", normalizedQuery: "soeren aagaard", results: [{ id: "1" }] },
      }),
    ).toEqual({
      tone: "success",
      title: "Mulige match fra kildebundne data",
      body: "Viser 1 muligt match. Resultaterne kan være ufuldstændige eller tvetydige og er ikke identitetsbevis.",
    });

    expect(
      getSearchFeedback({
        kind: "response",
        response: { status: "empty_result", normalizedQuery: "mette holm", results: [] },
      }),
    ).toEqual({
      tone: "neutral",
      title: "Ingen match i den aktive kilde",
      body: "Ingen resultater blev fundet. Fravær af match betyder ikke, at personen ikke har relation til en ejendom.",
    });

    expect(
      getSearchFeedback({
        kind: "response",
        response: { status: "blocked", normalizedQuery: "andersen", reason: "overly_broad_query", results: [] },
      }),
    ).toEqual({
      tone: "warning",
      title: "Søgningen blev afvist",
      body: "Denne søgning er for bred eller risikerer masseopslag. Brug et mere præcist navn.",
    });

    expect(getSearchFeedback({ kind: "network_error" })).toEqual({
      tone: "danger",
      title: "Søgningen kunne ikke gennemføres",
      body: "Der opstod en teknisk fejl. Prøv igen og bekræft svarene mod den oprindelige kilde.",
    });
  });

  it("stores the first-search acknowledgement defensively", () => {
    expect(hasStoredSensitiveSearchAcknowledgement(null)).toBe(false);
    expect(hasStoredSensitiveSearchAcknowledgement("pending")).toBe(false);
    expect(hasStoredSensitiveSearchAcknowledgement("acknowledged")).toBe(true);
  });
});
