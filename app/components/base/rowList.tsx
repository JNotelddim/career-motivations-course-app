import cn from "classnames";

// Repeatable-record control: an add/remove list of rows, each row a record keyed by `fields`.
// Each row carries a hand-rolled stable `id` (crypto.randomUUID) so React keys and answer
// identity survive reordering/removal — the accepted tradeoff noted for the dynamic lists.
//
// NOTE for wiring: this emits `RowListRow[]`. The placeholder
// `RowListAnswer.value: Record<string, boolean>` in answerStateProvider.tsx will need to
// become `RowListRow[]` to match (already flagged as a placeholder in TASKS).

type RowListField = { id: string; label: string };

export type RowListRow = { id: string; values: Record<string, string> };

export const RowList: React.FC<{
    fields: RowListField[];
    value: RowListRow[];
    onChange: (newValue: RowListRow[]) => void;
    className?: string;
    addRowLabel?: string;
}> = ({ fields, value, onChange, className, addRowLabel = "+ Add row" }) => {
    const handleFieldChange = (rowId: string, fieldId: string, fieldValue: string) => {
        onChange(
            value.map((row) =>
                row.id === rowId ? { ...row, values: { ...row.values, [fieldId]: fieldValue } } : row,
            ),
        );
    };

    const handleAddRow = () => {
        onChange([...value, { id: crypto.randomUUID(), values: {} }]);
    };

    const handleRemoveRow = (rowId: string) => {
        onChange(value.filter((row) => row.id !== rowId));
    };

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {value.length === 0 && <p className="text-sm text-gray-500">No rows yet.</p>}

            {value.map((row, rowIndex) => (
                <div key={row.id} className="flex flex-col gap-2 rounded border p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Row {rowIndex + 1}</span>
                        <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-sm text-red-500 hover:underline cursor-pointer"
                        >
                            Remove
                        </button>
                    </div>

                    {fields.map((field) => (
                        <label key={field.id} className="flex flex-col gap-1">
                            <span className="text-sm text-gray-700">{field.label}</span>
                            <input
                                type="text"
                                value={row.values[field.id] ?? ""}
                                onChange={(e) => handleFieldChange(row.id, field.id, e.target.value)}
                                className="border rounded p-2"
                            />
                        </label>
                    ))}
                </div>
            ))}

            <div>
                <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-4 py-2 bg-gray-800 bg-opacity-50 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors duration-200"
                >
                    {addRowLabel}
                </button>
            </div>
        </div>
    );
}
