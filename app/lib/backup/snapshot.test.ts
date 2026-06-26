import { describe, expect, it } from "vitest";

import { MODULES } from "~/consts/modules";
import {
  buildProgressSnapshot,
  compareProgress,
  PROGRESS_SNAPSHOT_VERSION,
  progressSnapshotSchema,
  type BackupProgressSnapshot,
} from "~/lib/backup/snapshot";

/** Build a snapshot by hand for the comparison tests. */
const snap = (modules: BackupProgressSnapshot["modules"]): BackupProgressSnapshot => ({
  version: PROGRESS_SNAPSHOT_VERSION,
  modules,
});

describe("buildProgressSnapshot", () => {
  it("captures every module, all zero, for empty answers", () => {
    const snapshot = buildProgressSnapshot({});

    expect(snapshot.version).toBe(PROGRESS_SNAPSHOT_VERSION);
    expect(Object.keys(snapshot.modules)).toHaveLength(MODULES.length);
    expect(progressSnapshotSchema.safeParse(snapshot).success).toBe(true);

    for (const module of MODULES) {
      expect(snapshot.modules[String(module.id)].requiredDone).toBe(0);
      expect(snapshot.modules[String(module.id)].requiredTotal).toBeGreaterThan(0);
    }
  });

  it("reflects a completed required exercise in its module's count", () => {
    // Find a real required exercise to mark complete.
    const module = MODULES.find((m) =>
      m.sections.some((s) => s.exercises.some((e) => !e.optional)),
    )!;
    const requiredExercise = module.sections
      .flatMap((s) => s.exercises)
      .find((e) => !e.optional)!;

    const snapshot = buildProgressSnapshot({
      [requiredExercise.id]: { isComplete: true },
    });

    expect(snapshot.modules[String(module.id)].requiredDone).toBe(1);
  });
});

describe("compareProgress", () => {
  it("flags no loss when the snapshot is at or ahead of current", () => {
    const snapshot = snap({ "1": { requiredDone: 3, requiredTotal: 3 } });
    const current = snap({ "1": { requiredDone: 2, requiredTotal: 3 } });

    const result = compareProgress(snapshot, current);
    expect(result.wouldLoseProgress).toBe(false);
    expect(result.regressions).toHaveLength(0);
  });

  it("flags loss when current is further along than the snapshot", () => {
    const snapshot = snap({ "1": { requiredDone: 1, requiredTotal: 3 } });
    const current = snap({ "1": { requiredDone: 3, requiredTotal: 3 } });

    const result = compareProgress(snapshot, current);
    expect(result.wouldLoseProgress).toBe(true);
    expect(result.regressions).toEqual([
      { moduleId: 1, snapshotDone: 1, currentDone: 3, requiredTotal: 3 },
    ]);
  });

  it("treats a module missing from the snapshot as zero done", () => {
    const snapshot = snap({});
    const current = snap({ "2": { requiredDone: 1, requiredTotal: 4 } });

    const result = compareProgress(snapshot, current);
    expect(result.wouldLoseProgress).toBe(true);
    expect(result.regressions[0]).toMatchObject({ moduleId: 2, snapshotDone: 0, currentDone: 1 });
  });

  it("reports each regressed module independently", () => {
    const snapshot = snap({
      "1": { requiredDone: 2, requiredTotal: 2 },
      "2": { requiredDone: 0, requiredTotal: 3 },
      "3": { requiredDone: 1, requiredTotal: 3 },
    });
    const current = snap({
      "1": { requiredDone: 2, requiredTotal: 2 }, // equal — no loss
      "2": { requiredDone: 1, requiredTotal: 3 }, // ahead — loss
      "3": { requiredDone: 3, requiredTotal: 3 }, // ahead — loss
    });

    const result = compareProgress(snapshot, current);
    expect(result.regressions.map((r) => r.moduleId).sort()).toEqual([2, 3]);
  });
});
