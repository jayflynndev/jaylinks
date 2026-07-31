import { METER_FLOOR, METER_START } from "@/lib/scoring/scoring";

interface PointsMeterProps {
  value: number;
}

/** Drain-bar color shifts as urgency increases — same rough bands as the share-card emoji grid. */
function meterColorClass(value: number): string {
  if (value >= 700) return "bg-emerald-400";
  if (value >= 300) return "bg-yellow-300";
  return "bg-red-400";
}

/** The draining points meter shown during each question — a bar plus the live numeric value. */
export function PointsMeter({ value }: PointsMeterProps) {
  const percent = Math.max(
    0,
    Math.min(100, ((value - METER_FLOOR) / (METER_START - METER_FLOOR)) * 100)
  );

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between px-1">
        <span className="font-display text-sm tracking-wide text-yellow-100/80">POINTS</span>
        <span className="font-display text-2xl tabular-nums text-yellow-300">{value}</span>
      </div>
      <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-purple-950/60 ring-1 ring-yellow-300/30">
        <div
          className={`h-full rounded-full transition-[width] duration-150 ease-linear ${meterColorClass(value)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
