import type { RevealedAnswer } from "./types";

interface RevealedAnswersListProps {
  answers: RevealedAnswer[];
}

/** The growing list of already-answered questions, kept visible throughout the puzzle — players need them to guess the link. */
export function RevealedAnswersList({ answers }: RevealedAnswersListProps) {
  if (answers.length === 0) return null;

  return (
    <ol className="flex w-full flex-col gap-2">
      {answers.map((answer, index) => (
        <li
          key={index}
          className="flex items-start gap-3 rounded-xl border border-yellow-300/20 bg-purple-950/40 px-4 py-2"
        >
          <span
            className={`mt-0.5 font-display text-sm ${answer.correct ? "text-emerald-300" : "text-red-300"}`}
          >
            {answer.correct ? "✓" : "✕"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-xs text-yellow-100/60">{answer.questionText}</p>
            <p className="font-sans text-base text-yellow-50">{answer.answerText}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
