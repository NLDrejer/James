import { describe, expect, it } from "vitest";

import { normalizeDanishAddress } from "@/lib/search/normalize-danish-address";
import { normalizeDanishName } from "@/lib/search/normalize-danish-name";

describe("Danish normalization helpers", () => {
  it("normalizes Danish names while preserving searchable æ/ø/å variants", () => {
    expect(normalizeDanishName("  Søren   Ågård  ")).toBe("soeren aagaard");
    expect(normalizeDanishName("A\u030ase A\u030agaard")).toBe("aase aagaard");
    expect(normalizeDanishName("ÅSE ØSTERGAARD")).toBe("aase oestergaard");
    expect(normalizeDanishName("Niels-Peter Ærø")).toBe("niels peter aeroe");
  });

  it("normalizes common Danish address formatting variants", () => {
    expect(normalizeDanishAddress("  Bøgelunden  4, 8000 Aarhus C ")).toBe(
      "boegelunden 4 8000 aarhus c",
    );
    expect(normalizeDanishAddress("Havnegade 12 st. tv., 5000 Odense")).toBe(
      "havnegade 12 st tv 5000 odense",
    );
  });
});
