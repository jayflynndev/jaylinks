/**
 * Pure parsing/validation for the bulk-import JSON payload, matching the
 * schema documented in docs/ADDING_PUZZLES.md. No DB access here — callers
 * separately check episode-number collisions and duplicate link answers
 * against the database (see src/lib/puzzles/admin-queries.ts) before
 * inserting.
 */

export interface BulkImportPuzzle {
  episodeNumber: number;
  publishDate: string | null;
  categorySlug: string;
  title: string;
  /** Exactly 5 clue words/phrases, in reveal order. */
  clues: string[];
  linkAnswer: string;
  linkAlternatives: string[];
}

export type ParseBulkImportResult =
  | { ok: true; puzzles: BulkImportPuzzle[] }
  | { ok: false; error: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/**
 * Parses and validates a bulk-import JSON payload. Fails on the first
 * problem found, with a message that identifies which puzzle (1-indexed,
 * matching the array position a human would count) and which field.
 */
export function parseBulkImportPayload(raw: string): ParseBulkImportResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That's not valid JSON." };
  }

  if (!Array.isArray(json) || json.length === 0) {
    return { ok: false, error: "Expected a non-empty JSON array of puzzles." };
  }

  const puzzles: BulkImportPuzzle[] = [];

  for (let i = 0; i < json.length; i++) {
    const label = `Puzzle #${i + 1}`;
    const entry = json[i];

    if (typeof entry !== "object" || entry === null) {
      return { ok: false, error: `${label}: expected an object.` };
    }
    const e = entry as Record<string, unknown>;

    if (typeof e.episode_number !== "number" || !Number.isInteger(e.episode_number) || e.episode_number <= 0) {
      return { ok: false, error: `${label}: episode_number must be a positive whole number.` };
    }
    if (!isNonEmptyString(e.title)) {
      return { ok: false, error: `${label}: title is required.` };
    }
    if (!isNonEmptyString(e.link_answer)) {
      return { ok: false, error: `${label}: link_answer is required.` };
    }
    if (e.publish_date !== undefined && e.publish_date !== null && typeof e.publish_date !== "string") {
      return { ok: false, error: `${label}: publish_date must be a string or omitted.` };
    }
    if (!Array.isArray(e.clues) || e.clues.length !== 5) {
      return { ok: false, error: `${label}: clues must be an array of exactly 5 strings.` };
    }

    const clues: string[] = [];
    for (let ci = 0; ci < e.clues.length; ci++) {
      const clue = e.clues[ci];
      if (!isNonEmptyString(clue)) {
        return { ok: false, error: `${label}, clue ${ci + 1}: expected a non-empty string.` };
      }
      clues.push(clue.trim());
    }

    puzzles.push({
      episodeNumber: e.episode_number,
      publishDate: typeof e.publish_date === "string" ? e.publish_date : null,
      categorySlug: typeof e.category_slug === "string" ? e.category_slug : "daily",
      title: (e.title as string).trim(),
      clues,
      linkAnswer: (e.link_answer as string).trim(),
      linkAlternatives: stringArray(e.link_alternatives),
    });
  }

  return { ok: true, puzzles };
}

/** Episode numbers that appear more than once within the same payload, sorted ascending. */
export function findDuplicateEpisodeNumbers(puzzles: BulkImportPuzzle[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();

  for (const puzzle of puzzles) {
    if (seen.has(puzzle.episodeNumber)) {
      duplicates.add(puzzle.episodeNumber);
    }
    seen.add(puzzle.episodeNumber);
  }

  return [...duplicates].sort((a, b) => a - b);
}
