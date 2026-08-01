"use client";

import { useActionState } from "react";
import Link from "next/link";
import { savePuzzle, type PuzzleFormState } from "@/app/admin/(protected)/puzzles/actions";
import type { EditablePuzzle } from "@/lib/puzzles/admin-queries";

interface PuzzleFormProps {
  /** Present when editing an existing puzzle; absent when creating a new one. */
  initialPuzzle?: EditablePuzzle;
  /** Auto-incremented suggestion for a new puzzle's episode number. */
  defaultEpisodeNumber?: number;
}

const EMPTY_CLUE = { clueText: "" };

const INITIAL_STATE: PuzzleFormState = {};

export function PuzzleForm({ initialPuzzle, defaultEpisodeNumber }: PuzzleFormProps) {
  const [state, formAction, isPending] = useActionState(savePuzzle, INITIAL_STATE);

  const clues = Array.from({ length: 5 }, (_, i) => initialPuzzle?.clues[i] ?? EMPTY_CLUE);
  const savedId = state.savedPuzzleId ?? initialPuzzle?.id;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="puzzleId" value={initialPuzzle?.id ?? ""} />

      {state.error && (
        <p className="rounded-xl border border-red-400/50 bg-red-950/40 px-4 py-2 font-sans text-red-300">
          {state.error}
        </p>
      )}
      {state.savedPuzzleId && !state.error && (
        <div className="rounded-xl border border-emerald-400/50 bg-emerald-950/30 px-4 py-2 font-sans text-emerald-300">
          Saved Link #{state.savedEpisodeNumber}.
          {savedId && (
            <>
              {" "}
              <Link href={`/admin/puzzles/${savedId}/preview`} className="underline">
                Preview it
              </Link>
              .
            </>
          )}
        </div>
      )}
      {state.duplicateWarnings && state.duplicateWarnings.length > 0 && (
        <div className="rounded-xl border border-yellow-400/50 bg-yellow-950/20 px-4 py-3 font-sans text-sm text-yellow-200">
          <p className="font-semibold">⚠ Possible repeats:</p>
          <ul className="mt-1 flex flex-col gap-1">
            {state.duplicateWarnings.map((match, index) => (
              <li key={index}>
                &ldquo;{match.text}&rdquo; looks like the link answer from Link #{match.matchedEpisodeNumber}{" "}
                ({match.matchedPuzzleTitle})
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset className="flex flex-col gap-4 rounded-2xl border-2 border-yellow-300/30 bg-purple-900/50 p-5">
        <legend className="px-2 font-display text-lg text-yellow-300">Puzzle</legend>

        <Field label="Category">
          <select
            disabled
            defaultValue="daily"
            className="rounded-full border-2 border-yellow-300/30 bg-purple-950/50 px-4 py-2 text-yellow-100/70"
          >
            <option value="daily">Daily</option>
          </select>
        </Field>

        <div className="flex flex-wrap gap-4">
          <Field label="Episode number">
            <input
              type="number"
              name="episodeNumber"
              min={1}
              required
              defaultValue={initialPuzzle?.episodeNumber ?? defaultEpisodeNumber}
              className="w-32 rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-4 py-2 text-yellow-50 focus:border-yellow-300 focus:outline-none"
            />
          </Field>
          <Field label="Publish date">
            <input
              type="date"
              name="publishDate"
              defaultValue={initialPuzzle?.publishDate ?? ""}
              className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-4 py-2 text-yellow-50 focus:border-yellow-300 focus:outline-none"
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={initialPuzzle?.status ?? "draft"}
              className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-4 py-2 text-yellow-50 focus:border-yellow-300 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </Field>
        </div>

        <Field label="Title">
          <input
            type="text"
            name="title"
            required
            defaultValue={initialPuzzle?.title ?? ""}
            className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-4 py-2 text-yellow-50 focus:border-yellow-300 focus:outline-none"
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-2xl border-2 border-yellow-300/30 bg-purple-900/50 p-5">
        <legend className="px-2 font-display text-lg text-yellow-300">
          Clues (revealed one every 5 seconds, in order)
        </legend>
        {clues.map((clue, index) => (
          <Field key={index} label={`Clue ${index + 1}`}>
            <input
              type="text"
              name={`clue${index + 1}`}
              required
              defaultValue={clue.clueText}
              className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-4 py-2 text-yellow-50 focus:border-yellow-300 focus:outline-none"
            />
          </Field>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border-2 border-yellow-300/30 bg-purple-900/50 p-5">
        <legend className="px-2 font-display text-lg text-yellow-300">The link</legend>
        <Field label="Link answer">
          <input
            type="text"
            name="linkAnswer"
            required
            defaultValue={initialPuzzle?.linkAnswer ?? ""}
            className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-4 py-2 text-yellow-50 focus:border-yellow-300 focus:outline-none"
          />
        </Field>
        <Field label="Link alternatives (comma-separated)">
          <input
            type="text"
            name="linkAlternatives"
            defaultValue={initialPuzzle?.linkAlternatives.join(", ") ?? ""}
            className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-4 py-2 text-yellow-50 focus:border-yellow-300 focus:outline-none"
          />
        </Field>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-yellow-300 px-8 py-3 font-display text-lg tracking-wide text-purple-950 transition disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save puzzle"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-sans text-sm text-yellow-100/70">{label}</span>
      {children}
    </label>
  );
}
