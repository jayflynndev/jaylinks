import * as React from "react";
import { OptionTile } from "./OptionTile";

type Option = { id: string; label: string };

type Props = {
  options: Option[];
  eliminatedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
};

export function OptionGrid({
  options,
  eliminatedIds,
  selectedId,
  onToggle,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((opt) => (
        <OptionTile
          key={opt.id}
          label={opt.label}
          eliminated={eliminatedIds.has(opt.id)}
          selected={selectedId === opt.id}
          onClick={() => onToggle(opt.id)}
        />
      ))}
    </div>
  );
}
