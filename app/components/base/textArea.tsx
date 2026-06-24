import cn from "classnames";

// Long-text control — a clean redundant-instance of `TextInput` (textInput.tsx) over a <textarea>.
// Pure controlled component: takes value + onChange, knows nothing about the answer schema.
export const TextArea: React.FC<{
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
    className?: string;
    charLimit?: number;
    rows?: number;
}> = ({ value, onChange, placeholder, className, charLimit, rows = 6 }) => {
    return (
        <div>
            {charLimit && (
                <div className={cn("text-sm text-gray-500 mb-1", { "text-red-500": value.length > charLimit })}>
                    {value.length}/{charLimit}
                </div>
            )}

            <textarea
                value={value}
                rows={rows}
                onChange={(e) => {
                    if (!charLimit || e.target.value.length <= charLimit) {
                        onChange(e.target.value);
                    }
                }}
                placeholder={placeholder}
                className={cn("border rounded p-2 w-full", className)}
            />
        </div>
    );
}