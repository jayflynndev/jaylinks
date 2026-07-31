/**
 * Normalises a player's typed answer (or a canonical answer/alternative)
 * into a comparable form: lowercase, diacritics stripped, punctuation
 * stripped, whitespace collapsed and trimmed.
 *
 * Examples: "Café-Sonnet!!" -> "cafe sonnet", "Don't Stop" -> "dont stop".
 * Stripping punctuation entirely (rather than turning it into a space)
 * means "GoldenEye" and "Golden-Eye" both normalise to "goldeneye" — an
 * intentional generosity, since players won't remember exact punctuation.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .normalize("NFD") // split accented chars into base char + combining mark
    .replace(/[̀-ͯ]/g, "") // strip the combining marks (diacritics)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // strip all punctuation/symbols
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a normalised answer into words, for surname-only matching etc.
 */
export function words(normalized: string): string[] {
  return normalized.length === 0 ? [] : normalized.split(" ");
}
