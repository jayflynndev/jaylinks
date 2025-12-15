import * as React from "react";

type Props = {
  label: string;
  eliminated: boolean;
  selected: boolean;
  onClick: () => void;
};

export function OptionTile({ label, eliminated, selected, onClick }: Props) {
  const cls = [
    "w-full select-none rounded-2xl border px-4 py-4 text-left shadow-sm",
    "transition-all duration-150 ease-out",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
    eliminated
      ? "bg-[#1a1d24] bg-black/30 text-white/40 opacity-40 scale-[0.98] line-through"
      : "border-white/15 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10",
    selected && !eliminated
      ? "ring-2 ring-amber-400/60 bg-amber-400/15 shadow-md shadow-amber-500/20"
      : "",
  ].join(" ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cls}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="block text-base font-semibold text-white">
          {label}
        </span>

        {eliminated ? (
          <span
            className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/20
 bg-white/5 text-xs text-white/50"
          >
            ✕
          </span>
        ) : selected ? (
          <span
            className="mt-0.5 inline-flex h-6 px-2 items-center justify-center rounded-full border border-amber-400/20
 bg-white/10 text-[11px] font-medium text-white/80"
          >
            Selected
          </span>
        ) : null}
      </div>
    </button>
  );
}
