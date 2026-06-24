import { z } from "zod";

import { ExerciseKind, type Exercise } from "~/consts/modules";
import type { RowListRow } from "~/components/base";

// Advisory validation: given an exercise and its current answer value, return a list of
// human-readable problems. Empty array = valid (or no rules / unanswered). Never throws,
// never blocks — module.tsx renders these as hints and folds emptiness into `isComplete`.
export function validateAnswer(exercise: Exercise, value: unknown): string[] {
    if (value == null) return []; // unanswered is incomplete, not invalid

    switch (exercise.kind) {
        case ExerciseKind.SHORT_TEXT:
        case ExerciseKind.LONG_TEXT:
            return validateText(exercise.validation, value as string);
        case ExerciseKind.MATRIX:
            return validateMatrix(exercise, value as Record<string, string>);
        case ExerciseKind.ROW_LIST:
            return validateRowList(exercise, value as RowListRow[]);
    }
}

function validateText(
    rules: { minLength?: number; maxLength?: number } | undefined,
    value: string,
): string[] {
    // Don't flag emptiness as invalid — that's "incomplete", surfaced via isComplete.
    if (!rules || (value ?? "").trim() === "") return [];

    let schema = z.string();
    if (rules.minLength !== undefined)
        schema = schema.min(rules.minLength, `Must be at least ${rules.minLength} characters`);
    if (rules.maxLength !== undefined)
        schema = schema.max(rules.maxLength, `Must be at most ${rules.maxLength} characters`);

    const result = schema.safeParse(value);
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function validateMatrix(
    exercise: Extract<Exercise, { kind: ExerciseKind.MATRIX }>,
    value: Record<string, string>,
): string[] {
    const rules = exercise.validation;
    if (!rules) return [];

    const errors: string[] = [];
    // Cells are keyed `${rowIndex}::${columnId}` by the Matrix control; only validate filled cells.
    const filled = Object.entries(value).filter(([, cell]) => cell.trim() !== "");

    if (rules.cellType === "number") {
        let cellSchema = z.coerce.number({ message: "must be a number" });
        if (rules.min !== undefined) cellSchema = cellSchema.min(rules.min, `must be ≥ ${rules.min}`);
        if (rules.max !== undefined) cellSchema = cellSchema.max(rules.max, `must be ≤ ${rules.max}`);

        for (const [key, cell] of filled) {
            const result = cellSchema.safeParse(cell.trim());
            if (!result.success) {
                errors.push(`${cellLabel(exercise, key)}: ${result.error.issues[0].message}`);
            }
        }
    }

    if (rules.uniqueCells) {
        const counts = new Map<string, number>();
        for (const [, cell] of filled) {
            const norm = cell.trim();
            counts.set(norm, (counts.get(norm) ?? 0) + 1);
        }
        const dupes = [...counts.entries()].filter(([, n]) => n > 1).map(([val]) => val);
        if (dupes.length > 0) {
            errors.push(`Each value must be unique (repeated: ${dupes.join(", ")})`);
        }
    }

    return errors;
}

function validateRowList(
    exercise: Extract<Exercise, { kind: ExerciseKind.ROW_LIST }>,
    value: RowListRow[],
): string[] {
    const rules = exercise.validation;
    if (!rules) return [];

    const errors: string[] = [];
    const rows = value ?? [];

    if (rules.minRows !== undefined && rows.length < rules.minRows)
        errors.push(`Add at least ${rules.minRows} row${rules.minRows === 1 ? "" : "s"}`);
    if (rules.maxRows !== undefined && rows.length > rules.maxRows)
        errors.push(`At most ${rules.maxRows} row${rules.maxRows === 1 ? "" : "s"}`);

    if (rules.requiredFields?.length) {
        const labelOf = (fieldId: string) =>
            exercise.fields.find((field) => field.id === fieldId)?.label ?? fieldId;
        rows.forEach((row, index) => {
            const missing = rules.requiredFields!.filter(
                (fieldId) => (row.values[fieldId] ?? "").trim() === "",
            );
            if (missing.length > 0) {
                errors.push(`Row ${index + 1}: missing ${missing.map(labelOf).join(", ")}`);
            }
        });
    }

    return errors;
}

// Turn a `${rowIndex}::${columnId}` cell key into a readable "Row label / Column label".
function cellLabel(exercise: Extract<Exercise, { kind: ExerciseKind.MATRIX }>, key: string): string {
    const [rowIndexRaw, columnId] = key.split("::");
    const rowLabel = exercise.rows[Number(rowIndexRaw)] ?? `Row ${rowIndexRaw}`;
    // For single-column matrices the row label alone is unambiguous.
    if (exercise.columns.length <= 1) return rowLabel;
    const columnLabel = exercise.columns.find((column) => column.id === columnId)?.label ?? columnId;
    return `${rowLabel} / ${columnLabel}`;
}
