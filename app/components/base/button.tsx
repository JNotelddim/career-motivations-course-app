export type ButtonProps = {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}

export const Button = ({ children, onClick, disabled }: ButtonProps) => {
    return (
        <button
            className="px-4 py-2 bg-gray-800 bg-opacity-50 text-white rounded hover:bg-blue-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors duration-200"
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}