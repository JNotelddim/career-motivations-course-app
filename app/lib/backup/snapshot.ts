import { z } from "zod";

import { MODULES } from "~/consts/modules";
import { moduleProgress } from "~/lib/progress";

// Plaintext progress snapshot — the non-authoritative hint stored *alongside*
// (never inside) the encrypted envelope. Its whole job is the overwrite guard:
// because the ciphertext is opaque to us until decrypted, this plaintext
// summary lets the account page compare a backup's progress against the current
// local progress *before* committing a destructive restore (or to nudge a
// staleness prompt when local has moved ahead of the last backup).
//
// It is a HINT, never authority: progress is always re-derived from the answers
// after a restore (the derive-don't-store principle). Nothing is ever gated on
// these numbers — they only decide whether to *warn*.

/** Bump if the snapshot's shape changes incompatibly. */
export const PROGRESS_SNAPSHOT_VERSION = 1;

/** Per-module completion, reduced to the two numbers the overwrite guard needs. */
export type ModuleProgressSnapshot = {
  requiredDone: number;
  requiredTotal: number;
};

export type BackupProgressSnapshot = {
  version: number;
  /** Keyed by module id. JSON object keys are strings, so we key by string id. */
  modules: Record<string, ModuleProgressSnapshot>;
};

const moduleProgressSnapshotSchema = z.object({
  requiredDone: z.number().int().nonnegative(),
  requiredTotal: z.number().int().nonnegative(),
});

export const progressSnapshotSchema = z.object({
  version: z.number().int().positive(),
  modules: z.record(z.string(), moduleProgressSnapshotSchema),
});

/** Minimal answer shape this needs; the full AnswerValue satisfies it (same as progress.ts). */
type AnswerLike = { isComplete: boolean };

/** Capture the current per-module required-completion counts from answer state. */
export function buildProgressSnapshot(
  answers: Record<string, AnswerLike | undefined>,
): BackupProgressSnapshot {
  const modules: Record<string, ModuleProgressSnapshot> = {};
  for (const module of MODULES) {
    const { requiredDone, requiredTotal } = moduleProgress(module, answers);
    modules[String(module.id)] = { requiredDone, requiredTotal };
  }
  return { version: PROGRESS_SNAPSHOT_VERSION, modules };
}

export type ModuleRegression = {
  moduleId: number;
  /** Required exercises complete in the snapshot we'd apply. */
  snapshotDone: number;
  /** Required exercises complete right now, locally. */
  currentDone: number;
  requiredTotal: number;
};

export type ProgressComparison = {
  /** Modules where the CURRENT local state is further along than `snapshot`. */
  regressions: ModuleRegression[];
  /** True iff applying `snapshot` over local state would drop required progress. */
  wouldLoseProgress: boolean;
};

/**
 * Compare a snapshot we might apply against the current local snapshot.
 *
 * Symmetric in use:
 * - **Restore preview** — `snapshot` = the backup about to overwrite local,
 *   `current` = local now. `wouldLoseProgress` ⇒ restoring would clobber more-
 *   complete local work; warn loudly before proceeding.
 * - **Staleness nudge** — `snapshot` = the last backup, `current` = local now.
 *   `wouldLoseProgress` ⇒ local has advanced past the backup; prompt to re-back-up.
 *
 * "Further along" is measured per module on required-completion counts only
 * (optional work never affects the warning), matching the numeric-level compare
 * the design calls for.
 */
export function compareProgress(
  snapshot: BackupProgressSnapshot,
  current: BackupProgressSnapshot,
): ProgressComparison {
  const regressions: ModuleRegression[] = [];

  for (const [moduleId, cur] of Object.entries(current.modules)) {
    // A module absent from the snapshot counts as 0 done — conservative: it
    // means "the snapshot has nothing here", so any local progress is at risk.
    const snapshotDone = snapshot.modules[moduleId]?.requiredDone ?? 0;
    if (cur.requiredDone > snapshotDone) {
      regressions.push({
        moduleId: Number(moduleId),
        snapshotDone,
        currentDone: cur.requiredDone,
        requiredTotal: cur.requiredTotal,
      });
    }
  }

  return { regressions, wouldLoseProgress: regressions.length > 0 };
}
