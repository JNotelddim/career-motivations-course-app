import cn from "classnames";
import { FIELD_CLASS } from "./styles";

// Basic
export const TextInput: React.FC<{
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
    className?: string;
    charLimit?: number;
}> = ({ value, onChange, placeholder, className, charLimit }) => {
    return (
        <div>
            {charLimit && (
                <div className={cn("text-sm text-gray-500 mb-1", { "text-red-500": value.length > charLimit })}>
                    {value.length}/{charLimit}
                </div>
            )}

        <input
            type="text"
            value={value}
            onChange={(e) => {
                if (!charLimit || e.target.value.length <= charLimit) {
                    onChange(e.target.value);
                }
            }}
            placeholder={placeholder}
            className={cn(FIELD_CLASS, className)}
        />
        </div>
    );
}