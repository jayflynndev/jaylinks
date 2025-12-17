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
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50",
    eliminated
      ? "bg-gray-800/50 text-gray-500 opacity-30 scale-[0.95] line-through border-gray-600/30"
      : "border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 hover:scale-[1.02]",
    selected
      ? "ring-2 ring-yellow-400/60 bg-yellow-400/15 shadow-md shadow-yellow-500/20"
      : "",
  ].join(" ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cls}
      aria-pressed={selected}
      onTouchStart={(e) => e.preventDefault()} // Prevent double-tap zoom on mobile
    >
      <div className="flex items-start justify-between gap-3">
        <span className="block text-base font-semibold text-white">
          {label}
        </span>

        {eliminated ? null : selected ? (
          <span
            className="mt-0.5 inline-flex h-6 px-2 items-center justify-center rounded-full border border-yellow-400/20
 bg-yellow-500/10 text-[11px] font-medium text-yellow-200"
          >
            Selected
          </span>
        ) : null}
      </div>
    </button>
  );
}
