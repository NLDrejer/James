const DANISH_CHARACTER_REPLACEMENTS: Record<string, string> = {
  æ: "ae",
  ø: "oe",
  å: "aa",
};

export const normalizeDanishText = (value: string) => {
  let normalized = value.trim().toLocaleLowerCase("da-DK").normalize("NFC");

  for (const [danishCharacter, replacement] of Object.entries(DANISH_CHARACTER_REPLACEMENTS)) {
    normalized = normalized.replaceAll(danishCharacter, replacement);
  }

  return normalized
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};
