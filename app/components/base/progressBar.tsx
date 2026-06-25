import cn from "classnames";

// Thin horizontal progress meter. `value` is 0..1; it's clamped defensively so a
// caller can't overflow the track. Presentational only — it knows nothing about
// what's being measured.
export const ProgressBar: React.FC<{
  value: number;
  className?: string;
  /** When true, the fill turns green to signal completion. */
  complete?: boolean;
  /** Human-readable status for screen readers (the bar is otherwise label-less). */
  label?: string;
}> = ({ value, className, complete, label }) => {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={label ?? `${pct}%`}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-300",
          complete ? "bg-green-500" : "bg-blue-500",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
