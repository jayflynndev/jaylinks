import * as React from "react";

type Props = {
  label: string;
  eliminated: boolean;
  selected: boolean;
  onClick: () => void;
};

export function OptionTile({ label, eliminated, selected, onClick }: Props) {
  const cls = [
    "w-full select-none rounded-2xl border px-4 py-4 text-left shadow-sm transition",
    eliminated
      ? "border-white/5 bg-white/5 opacity-40 line-through"
      : "border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.99]",
    selected && !eliminated ? "ring-2 ring-white/30" : "",
  ].join(" ");

  return (
    <button type="button" onClick={onClick} className={cls}>
      <span className="block text-base font-medium text-white">{label}</span>
    </button>
  );
}
