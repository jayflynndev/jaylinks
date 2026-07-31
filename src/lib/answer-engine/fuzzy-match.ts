import { levenshteinDistance } from "./levenshtein";
import { normalizeAnswer, words } from "./normalize";

/**
 * Tier 1 of the three-tier answer engine (docs/ANSWER_ENGINE.md). Pure,
 * synchronous, and free — this is the fast path that resolves the large
 * majority of correct answers without ever calling the AI judge. Used
 * identically for regular question answers and link guesses; callers just
 * pass the relevant canonical answer + alternatives.
 */

export interface FuzzyMatchResult {
  correct: boolean;
  /** Which candidate string it matched against, for logging/debugging. */
  matchedCandidate?: string;
  /** How it matched: exact string equality, edit-distance typo tolerance, or surname-only. */
  matchType?: "exact" | "typo" | "surname";
}

/** Levenshtein tolerance scales with target length: short answers are more typo-sensitive. */
function toleranceFor(targetLength: number): number {
  return targetLength >= 5 ? 2 : 1;
}

// Below this normalised length, allowing a surname-only match risks
// accepting near-meaningless one/two-letter fragments — require a real name.
const MIN_SURNAME_LENGTH = 3;

/**
 * Checks a single normalised guess against a single normalised candidate
 * (a canonical answer or one alternative), including the "surname-only for
 * people" rule: if the candidate is a multi-word name (e.g. "sean
 * connery"), the guess is also accepted if it matches just the last word
 * ("connery"). We don't have an "is this a person" flag in the schema, so
 * this applies to any multi-word candidate — a deliberate generosity
 * trade-off documented in docs/ANSWER_ENGINE.md.
 */
function matchesCandidate(guessNormalized: string, candidateNormalized: string): FuzzyMatchResult {
  if (guessNormalized.length === 0 || candidateNormalized.length === 0) {
    return { correct: false };
  }

  if (guessNormalized === candidateNormalized) {
    return { correct: true, matchedCandidate: candidateNormalized, matchType: "exact" };
  }

  const distance = levenshteinDistance(guessNormalized, candidateNormalized);
  if (distance <= toleranceFor(candidateNormalized.length)) {
    return { correct: true, matchedCandidate: candidateNormalized, matchType: "typo" };
  }

  const candidateWords = words(candidateNormalized);
  if (candidateWords.length >= 2) {
    const surname = candidateWords[candidateWords.length - 1];
    if (surname.length >= MIN_SURNAME_LENGTH) {
      if (guessNormalized === surname) {
        return { correct: true, matchedCandidate: candidateNormalized, matchType: "surname" };
      }
      const surnameDistance = levenshteinDistance(guessNormalized, surname);
      if (surnameDistance <= toleranceFor(surname.length)) {
        return { correct: true, matchedCandidate: candidateNormalized, matchType: "surname" };
      }
    }
  }

  return { correct: false };
}

/**
 * Tier 1 fuzzy match entry point. Returns correct: true as soon as the
 * guess matches the canonical answer or any alternative (by exact match,
 * typo tolerance, or surname-only); otherwise correct: false, meaning the
 * caller should fall through to the Tier 2 AI judge.
 */
export function fuzzyMatch(
  rawGuess: string,
  canonicalAnswer: string,
  alternatives: string[] = []
): FuzzyMatchResult {
  const guessNormalized = normalizeAnswer(rawGuess);
  if (guessNormalized.length === 0) {
    return { correct: false };
  }

  const candidates = [canonicalAnswer, ...alternatives].map(normalizeAnswer);

  for (const candidate of candidates) {
    const result = matchesCandidate(guessNormalized, candidate);
    if (result.correct) {
      return result;
    }
  }

  return { correct: false };
}
