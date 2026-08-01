"use client";

import { useActionState } from "react";
import { bulkImport, type BulkImportState } from "@/app/admin/(protected)/puzzles/import/actions";

const INITIAL_STATE: BulkImportState = {};

const EXAMPLE = `[
  {
    "episode_number": 281,
    "publish_date": "2026-08-01",
    "category_slug": "daily",
    "title": "Streets",
    "clues": ["Sesame", "Quality", "Baker", "Coronation", "Fleet"],
    "link_answer": "Streets",
    "link_alternatives": ["Types of Street"]
  }
]`;

/** Bulk-import UI: paste JSON, preview warnings, then confirm to actually insert. See docs/ADDING_PUZZLES.md. */
export function BulkImportForm() {
  const [state, formAction, isPending] = useActionState(bulkImport, INITIAL_STATE);

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="font-sans text-sm text-yellow-100/70">
          Puzzle JSON — see docs/ADDING_PUZZLES.md for the full schema (each puzzle needs exactly 5
          clues). Example shape: <code className="text-yellow-200">{EXAMPLE.slice(0, 40)}…</code>
        </span>
        <textarea
          name="json"
          required
          rows={16}
          defaultValue={state.json ?? ""}
          spellCheck={false}
          className="rounded-2xl border-2 border-yellow-300/50 bg-purple-950/70 p-4 font-mono text-sm text-yellow-50 focus:border-yellow-300 focus:outline-none"
        />
      </label>

      {state.error && (
        <p className="rounded-xl border border-red-400/50 bg-red-950/40 px-4 py-2 font-sans text-red-300">
          {state.error}
        </p>
      )}

      {state.preview && (
        <div className="flex flex-col gap-2 rounded-xl border border-yellow-300/40 bg-purple-900/50 px-4 py-3 font-sans text-sm text-yellow-100">
          <p>
            Parsed <strong>{state.preview.puzzleCount}</strong> puzzle
            {state.preview.puzzleCount === 1 ? "" : "s"}: episodes{" "}
            {state.preview.episodeNumbers.join(", ")}
          </p>
          {state.preview.duplicateEpisodesInPayload.length > 0 && (
            <p className="text-red-300">
              ⚠ Repeated within this payload: episode{" "}
              {state.preview.duplicateEpisodesInPayload.join(", ")}
            </p>
          )}
          {state.preview.existingEpisodeCollisions.length > 0 && (
            <p className="text-red-300">
              ⚠ Already exist in the database: episode{" "}
              {state.preview.existingEpisodeCollisions.join(", ")} (these will fail to import unless
              changed)
            </p>
          )}
          {state.preview.duplicateAnswers.length > 0 && (
            <div className="text-yellow-200">
              <p>⚠ Possible repeat answers:</p>
              <ul className="mt-1 flex flex-col gap-1">
                {state.preview.duplicateAnswers.map((match, index) => (
                  <li key={index}>
                    &ldquo;{match.text}&rdquo; looks like the link answer from Link #
                    {match.matchedEpisodeNumber} ({match.matchedPuzzleTitle})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.importResults && (
        <ul className="flex flex-col gap-1 rounded-xl border border-yellow-300/40 bg-purple-900/50 px-4 py-3 font-sans text-sm">
          {state.importResults.map((row, index) => (
            <li key={index} className={row.ok ? "text-emerald-300" : "text-red-300"}>
              Episode {row.episodeNumber}: {row.message}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          name="intent"
          value="preview"
          disabled={isPending}
          className="rounded-full border-2 border-yellow-300 px-6 py-3 font-display tracking-wide text-yellow-300 disabled:opacity-50"
        >
          {isPending ? "Checking…" : "Preview"}
        </button>
        <button
          type="submit"
          name="intent"
          value="confirm"
          disabled={isPending || !state.preview}
          className="rounded-full bg-yellow-300 px-6 py-3 font-display tracking-wide text-purple-950 disabled:opacity-50"
        >
          {isPending ? "Importing…" : "Confirm import"}
        </button>
      </div>
    </form>
  );
}
