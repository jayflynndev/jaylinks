interface ClueListProps {
  /** The clue words revealed so far, in reveal order. */
  clues: string[];
}

/** The growing list of auto-revealed clue words — no correct/wrong indicator, since clues are never individually answered. */
export function ClueList({ clues }: ClueListProps) {
  if (clues.length === 0) return null;

  return (
    <ol className="flex flex-wrap justify-center gap-2">
      {clues.map((clue, index) => (
        <li
          key={index}
          className="rounded-full border-2 border-yellow-300/40 bg-purple-900/60 px-5 py-2 font-display text-lg text-yellow-50"
        >
          {clue}
        </li>
      ))}
    </ol>
  );
}
