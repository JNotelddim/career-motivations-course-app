// The single destructive write to the answers store, shared by every code path
// that replaces local answers wholesale: restore-from-backup and import-from-
// file. Both ultimately resolve to "here is the full answers JSON — make it the
// truth," so they share this primitive rather than each poking localStorage.

/** localStorage key the answer state provider reads/writes. */
export const ANSWERS_STORAGE_KEY = "answers";

/**
 * Replace all local answers with `answersJson`, then full-reload so every
 * consumer re-reads and re-derives progress from scratch. `answersJson` is the
 * exact string stored under localStorage["answers"] — the provider's reviver
 * turns the ISO date strings back into Dates on the next mount.
 *
 * Destructive and irreversible for whatever was there; callers own the
 * overwrite-guard / confirmation before calling.
 */
export function applyAnswers(answersJson: string): void {
  localStorage.setItem(ANSWERS_STORAGE_KEY, answersJson);
  // Full reload so every consumer re-reads the new answers from scratch.
  window.location.reload();
}
