import type { WorksheetModule } from "~/consts/modules";

// Module progress — DERIVED, never stored. Computed from the answer state on
// demand, so it can never go stale against the answers it summarizes (the
// project's derive-don't-store principle). See .scratch/TASKS.md / the
// data-persistence decision.
//
// The model (reasoned out 2026-06-24):
// - "Complete" means every *required* exercise is complete. Optional exercises
//   never count toward the denominator, so 100% is always reachable.
// - Optional work still earns an in-module "head start": before any required
//   exercise is done, touching any optional exercise shows a sliver of progress
//   strictly smaller than one required step (so the bar only ever moves *up*
//   when required work begins — no stall, no backwards signal).
// - The coarse 3-state is for the home overview; the percent is for in-module.

export type ModuleProgressState = "not-started" | "started" | "complete";

export type ModuleProgress = {
  state: ModuleProgressState;
  /** 0..1. Required-driven; reaches 1 only when every required exercise is complete. */
  percent: number;
  requiredTotal: number;
  requiredDone: number;
};

/** The optional head start, as a fraction of one required step. Half a step keeps
 *  it strictly below `1 / requiredTotal`, which is what guarantees monotonicity. */
const OPTIONAL_HEAD_START_FRACTION = 0.5;

/** Minimal shape this calc needs from an answer; the full AnswerValue satisfies it.
 *  Presence of a key = the exercise has been *touched*; `isComplete` = finished. */
type AnswerLike = { isComplete: boolean };

export function moduleProgress(
  module: WorksheetModule,
  answers: Record<string, AnswerLike | undefined>,
): ModuleProgress {
  const exercises = module.sections.flatMap((section) => section.exercises);
  const required = exercises.filter((exercise) => !exercise.optional);

  // Safeguard: a module with no required exercises (shouldn't exist, but don't
  // strand it at the sliver or divide by zero) — fall back to counting all
  // exercises as required. With no "extra" optionals left, the head start path
  // simply never triggers.
  const counted = required.length > 0 ? required : exercises;
  const headStartPool = required.length > 0 ? exercises.filter((e) => e.optional) : [];

  const requiredTotal = counted.length;
  const requiredDone = counted.filter((e) => answers[e.id]?.isComplete).length;
  const anyTouched = exercises.some((e) => answers[e.id] !== undefined);

  let percent: number;
  if (requiredTotal === 0) {
    percent = 0; // truly empty module — extreme guard; nothing to complete.
  } else if (requiredDone > 0) {
    percent = requiredDone / requiredTotal;
  } else {
    const headStartActive = headStartPool.some((e) => answers[e.id] !== undefined);
    percent = headStartActive
      ? OPTIONAL_HEAD_START_FRACTION / requiredTotal // < one required step, by construction
      : 0;
  }

  const state: ModuleProgressState =
    requiredTotal > 0 && requiredDone === requiredTotal
      ? "complete"
      : anyTouched
        ? "started"
        : "not-started";

  return { state, percent, requiredTotal, requiredDone };
}
