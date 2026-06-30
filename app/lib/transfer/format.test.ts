import { describe, expect, it } from "vitest";

import { ExerciseKind, MODULES } from "~/consts/modules";
import {
  ANSWERS_FORMAT,
  ANSWERS_PAYLOAD_VERSION,
  buildExportPayload,
  exportFileSchema,
  exportFilename,
  MalformedImportError,
  parseImportFile,
  UnknownExerciseIdError,
  UnsupportedImportVersionError,
  type AnswerFileValue,
} from "~/lib/transfer/format";

// A real, known exercise id of each kind, pulled from the content model so the
// tests track the actual seeded modules rather than hard-coded ids.
const idOfKind = (kind: ExerciseKind): string =>
  MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises)).find((e) => e.kind === kind)!.id;

const SHORT_ID = idOfKind(ExerciseKind.SHORT_TEXT);
const MATRIX_ID = idOfKind(ExerciseKind.MATRIX);
const ROWLIST_ID = idOfKind(ExerciseKind.ROW_LIST);

const shortAnswer = (value: string): AnswerFileValue => ({
  kind: ExerciseKind.SHORT_TEXT,
  value,
  isComplete: value.trim().length > 0,
  created: "2026-06-25T10:00:00.000Z",
  lastEdited: "2026-06-25T10:15:00.000Z",
});

/** A realistic answers map covering three kinds. */
const sampleAnswers = (): Record<string, AnswerFileValue> => ({
  [SHORT_ID]: shortAnswer("My answer"),
  [MATRIX_ID]: {
    kind: ExerciseKind.MATRIX,
    value: { "0::reaction": "resonates" },
    isComplete: false,
    created: "2026-06-25T10:00:00.000Z",
    lastEdited: "2026-06-25T10:00:00.000Z",
  },
  [ROWLIST_ID]: {
    kind: ExerciseKind.ROW_LIST,
    value: [{ id: "row-1", values: { decision: "Took the job", year: "2020" } }],
    isComplete: false,
    created: "2026-06-25T10:00:00.000Z",
    lastEdited: "2026-06-25T10:00:00.000Z",
  },
});

const fileText = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    format: ANSWERS_FORMAT,
    version: ANSWERS_PAYLOAD_VERSION,
    exportedAt: "2026-06-30T12:00:00.000Z",
    answers: sampleAnswers(),
    ...overrides,
  });

describe("buildExportPayload / exportFilename", () => {
  it("wraps answers in a self-describing, schema-valid envelope", () => {
    const payload = buildExportPayload(sampleAnswers(), "2026-06-30T12:00:00.000Z");

    expect(payload.format).toBe(ANSWERS_FORMAT);
    expect(payload.version).toBe(ANSWERS_PAYLOAD_VERSION);
    expect(exportFileSchema.safeParse(payload).success).toBe(true);
  });

  it("formats a dated filename", () => {
    expect(exportFilename(new Date("2026-06-30T12:00:00.000Z"))).toBe(
      `${ANSWERS_FORMAT}-2026-06-30.json`,
    );
  });
});

describe("parseImportFile — round trip", () => {
  it("accepts a file built by buildExportPayload (export → import is lossless)", () => {
    const answers = sampleAnswers();
    const text = JSON.stringify(buildExportPayload(answers, "2026-06-30T12:00:00.000Z"));

    const result = parseImportFile(text);
    expect(result.answers).toEqual(answers);
    expect(result.exportedAt).toBe("2026-06-30T12:00:00.000Z");
  });

  it("accepts an empty answers map", () => {
    expect(parseImportFile(fileText({ answers: {} })).answers).toEqual({});
  });
});

describe("parseImportFile — strict rejection", () => {
  it("rejects non-JSON as malformed", () => {
    expect(() => parseImportFile("not json {")).toThrow(MalformedImportError);
  });

  it("rejects a wrong/absent format marker as malformed", () => {
    expect(() => parseImportFile(fileText({ format: "something-else" }))).toThrow(
      MalformedImportError,
    );
  });

  it("rejects a malformed answer value/kind shape as malformed", () => {
    const answers = sampleAnswers();
    // shortText answer carrying a non-string value.
    (answers[SHORT_ID] as { value: unknown }).value = 42;
    expect(() => parseImportFile(fileText({ answers }))).toThrow(MalformedImportError);
  });

  it("rejects a known id whose kind disagrees with the content model", () => {
    // SHORT_ID is a shortText exercise; claim it's a matrix.
    const answers = {
      [SHORT_ID]: {
        kind: ExerciseKind.MATRIX,
        value: {},
        isComplete: false,
        created: "2026-06-25T10:00:00.000Z",
        lastEdited: "2026-06-25T10:00:00.000Z",
      },
    };
    expect(() => parseImportFile(fileText({ answers }))).toThrow(MalformedImportError);
  });

  it("rejects unknown exercise ids, naming them", () => {
    const answers = { "m99-does-not-exist": shortAnswer("orphan") };
    expect(() => parseImportFile(fileText({ answers }))).toThrow(UnknownExerciseIdError);
    try {
      parseImportFile(fileText({ answers }));
    } catch (e) {
      expect((e as UnknownExerciseIdError).ids).toEqual(["m99-does-not-exist"]);
    }
  });

  it("rejects a newer payload version (distinct from unknown-id)", () => {
    expect(() => parseImportFile(fileText({ version: ANSWERS_PAYLOAD_VERSION + 1 }))).toThrow(
      UnsupportedImportVersionError,
    );
  });

  it("prefers the version error over content errors for a newer file", () => {
    // Newer version AND an unknown id — version should win (it explains the rest).
    const answers = { "m99-nope": shortAnswer("x") };
    expect(() =>
      parseImportFile(fileText({ version: ANSWERS_PAYLOAD_VERSION + 1, answers })),
    ).toThrow(UnsupportedImportVersionError);
  });
});
