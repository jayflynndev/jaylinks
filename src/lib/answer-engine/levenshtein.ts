/**
 * Standard Levenshtein edit distance (single-character insert/delete/
 * substitute) between two strings, using an O(min(m,n)) memory DP — only
 * the previous row is kept, since that's all the recurrence needs.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Iterate with `b` as the shorter string to minimise row width.
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];

  let previousRow = Array.from({ length: shorter.length + 1 }, (_, i) => i);

  for (let i = 1; i <= longer.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= shorter.length; j++) {
      const substitutionCost = longer[i - 1] === shorter[j - 1] ? 0 : 1;
      currentRow.push(
        Math.min(
          currentRow[j - 1] + 1, // insertion
          previousRow[j] + 1, // deletion
          previousRow[j - 1] + substitutionCost // substitution
        )
      );
    }
    previousRow = currentRow;
  }

  return previousRow[shorter.length];
}
