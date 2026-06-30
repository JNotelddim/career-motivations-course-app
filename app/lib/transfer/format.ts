import { z } from "zod";

import { ExerciseKind, MODULES, type Exercise } from "~/consts/modules";

// Import / Export answers — the round-trip format core. PURE & testable: no DOM,
// no React, no localStorage. It only turns the stored answers map into a
// self-describing file payload and validates one back. The download/upload
// mechanics (Blob, FileReader) and the destructive apply live one layer up.
//
// Locked design (.scratch/TASKS.md, Track 3 B, 2026-06-30). Two principles:
//
// 1. ONE versioned round-trip format. Export writes exactly what import reads;
//    `version` is the contract between them.
// 2. THREE independent version stamps, ONE source of truth. This payload's
//    `version` is independent of the progress-snapshot version and the crypto
//    envelope version (BACKUP_ENVELOPE_VERSION — an orthogonal *crypto* axis).
//    A version protects a *serialization shape*, not the content model: the
//    answers shape, the progress shape, and the crypto shape change for
//    different reasons, so they version separately. But every schema here
//    *derives from* the `modules` const — the single source of truth — rather
//    than re-declaring the model.
//
// Validation is STRICT, all-or-nothing: an unknown exercise id OR a malformed
// value/kind shape rejects the whole file (no partial / warn-skip import). This
// rests on exercise ids being an append-only permanent contract (add and
// deprecate, never rename or reuse) — see modules.ts. Rejections are made
// legible via three distinct error types so the UI can explain *why*.

/** Marker so a stray JSON file is recognisably "not one of ours". */
export const ANSWERS_FORMAT = "career-reflection-answers";

/** Bump when the answers *payload shape* changes incompatibly. Independent of
 *  PROGRESS_SNAPSHOT_VERSION and BACKUP_ENVELOPE_VERSION (see header). */
export const ANSWERS_PAYLOAD_VERSION = 1;

/** Generous ceiling for 11 modules of long-form prose; guards the file picker. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

// --- Wire schemas -----------------------------------------------------------
// These validate the *serialized* (on-disk) shape, where `created`/`lastEdited`
// are ISO strings (JSON has no Date). The in-memory AnswerValue type (Date
// fields) lives in answerStateProvider; the provider's reviver turns these
// strings back into Dates when the imported answers are read after reload.

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "must be an ISO date string" });

const answerBase = {
  isComplete: z.boolean(),
  created: isoDateString,
  lastEdited: isoDateString,
};

const rowListRowSchema = z.object({
  id: z.string(),
  values: z.record(z.string(), z.string()),
});

/** The per-`kind` shape of a single saved answer, discriminated on `kind`. This
 *  is the schema the payload `version` gates — the structural guard import needs
 *  (validateAnswer() only checks *content* against an exercise's rules). */
export const answerValueSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal(ExerciseKind.SHORT_TEXT), value: z.string(), ...answerBase }),
  z.object({ kind: z.literal(ExerciseKind.LONG_TEXT), value: z.string(), ...answerBase }),
  z.object({ kind: z.literal(ExerciseKind.MATRIX), value: z.record(z.string(), z.string()), ...answerBase }),
  z.object({ kind: z.literal(ExerciseKind.ROW_LIST), value: z.array(rowListRowSchema), ...answerBase }),
]);

export type AnswerFileValue = z.infer<typeof answerValueSchema>;

/** The answers map, keyed by stable exercise id — same shape as localStorage. */
export const answersMapSchema = z.record(z.string(), answerValueSchema);

/** The full file payload: a self-describing wrapper around the answers map. */
export const exportFileSchema = z.object({
  format: z.literal(ANSWERS_FORMAT),
  version: z.number().int().positive(),
  exportedAt: isoDateString,
  answers: answersMapSchema,
});

export type ExportFile = z.infer<typeof exportFileSchema>;

// --- Errors -----------------------------------------------------------------
// Three distinct types → three legible UI messages (never a bare "invalid file").

/** The file is corrupt, not JSON, or not produced by this app (bad shape). */
export class MalformedImportError extends Error {
  constructor(detail?: string) {
    super(`This file isn't a valid answers export${detail ? ` — ${detail}` : ""}.`);
    this.name = "MalformedImportError";
  }
}

/** The file is well-formed but newer than this build understands. */
export class UnsupportedImportVersionError extends Error {
  constructor(public readonly version: number) {
    super(
      `This file was made by a newer version of the app (format v${version}). ` +
        `Update the app to import it.`,
    );
    this.name = "UnsupportedImportVersionError";
  }
}

/** The file references exercise ids that don't exist in this version's content. */
export class UnknownExerciseIdError extends Error {
  constructor(public readonly ids: string[]) {
    super(
      `This file references exercises that don't exist in this version of the app ` +
        `(${ids.join(", ")}).`,
    );
    this.name = "UnknownExerciseIdError";
  }
}

// --- Content-model lookup (the single source of truth) ----------------------
// Built once from MODULES at load. Used to reject unknown ids and to cross-check
// each answer's declared kind against the exercise's real kind.

const exercisesById: Map<string, Exercise> = new Map(
  MODULES.flatMap((module) => module.sections.flatMap((section) => section.exercises)).map(
    (exercise) => [exercise.id, exercise],
  ),
);

// --- Build (export) ---------------------------------------------------------

/**
 * Wrap a stored answers map in the versioned export envelope. `answers` is the
 * already-serialized localStorage shape (ISO date strings); we don't re-encode
 * it. `exportedAt` is injected (not stamped here) so this stays pure/testable.
 */
export function buildExportPayload(answers: Record<string, unknown>, exportedAt: string): ExportFile {
  return {
    format: ANSWERS_FORMAT,
    version: ANSWERS_PAYLOAD_VERSION,
    exportedAt,
    answers: answers as ExportFile["answers"],
  };
}

/** `career-reflection-answers-YYYY-MM-DD.json` for a given date. */
export function exportFilename(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${ANSWERS_FORMAT}-${yyyy}-${mm}-${dd}.json`;
}

// --- Parse (import) ---------------------------------------------------------

export type ParsedImport = {
  exportedAt: string;
  answers: Record<string, AnswerFileValue>;
};

/**
 * Parse and strictly validate an uploaded file's text. Returns the answers map
 * ready to apply, or throws one of the three typed errors above. Order matters:
 * a newer-version file is reported as such (not as "unknown ids"), and a
 * structurally broken file is reported before we reason about its contents.
 */
export function parseImportFile(text: string): ParsedImport {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new MalformedImportError("it isn't valid JSON");
  }

  const parsed = exportFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new MalformedImportError(parsed.error.issues[0]?.message);
  }
  const file = parsed.data;

  // Version first: a newer format explains anything unfamiliar that follows.
  if (file.version > ANSWERS_PAYLOAD_VERSION) {
    throw new UnsupportedImportVersionError(file.version);
  }

  // Strict referential + kind checks against the content model.
  const unknownIds: string[] = [];
  const kindMismatches: string[] = [];
  for (const [id, answer] of Object.entries(file.answers)) {
    const exercise = exercisesById.get(id);
    if (!exercise) {
      unknownIds.push(id);
      continue;
    }
    if (exercise.kind !== answer.kind) {
      kindMismatches.push(id);
    }
  }
  if (unknownIds.length > 0) {
    throw new UnknownExerciseIdError(unknownIds);
  }
  if (kindMismatches.length > 0) {
    throw new MalformedImportError(
      `some answers don't match their exercise type (${kindMismatches.join(", ")})`,
    );
  }

  return { exportedAt: file.exportedAt, answers: file.answers };
}
