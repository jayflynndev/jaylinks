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
      ? "border-white/5 bg-black/30 text-white/40 opacity-40 scale-[0.98] line-through"
      : "border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98]",
    selected && !eliminated ? "ring-2 ring-white/25 bg-white/10" : "",
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
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/50">
            ✕
          </span>
        ) : selected ? (
          <span className="mt-0.5 inline-flex h-6 px-2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[11px] font-medium text-white/80">
            Selected
          </span>
        ) : null}
      </div>
    </button>
  );
}
