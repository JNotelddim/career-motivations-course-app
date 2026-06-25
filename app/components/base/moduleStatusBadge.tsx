import cn from "classnames";
import type { ModuleProgressState } from "~/lib/progress";

// Coarse status pill for the home overview — the glance-able twin of the
// module page's precise percentage. Maps a derived ModuleProgressState to a
// label + tone; carries no logic of its own.
const STATUS: Record<ModuleProgressState, { label: string; className: string }> = {
  "not-started": { label: "Not started", className: "bg-gray-100 text-gray-500" },
  started: { label: "In progress", className: "bg-amber-100 text-amber-800" },
  complete: { label: "Complete", className: "bg-green-100 text-green-700" },
};

export const ModuleStatusBadge: React.FC<{
  state: ModuleProgressState;
  className?: string;
}> = ({ state, className }) => {
  const { label, className: tone } = STATUS[state];
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      {state === "complete" ? `✓ ${label}` : label}
    </span>
  );
};
