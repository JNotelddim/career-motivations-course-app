import cn from "classnames";
import { useState } from "react";

import { FIELD_CLASS } from "~/components/base";

/**
 * Password field with a show/hide toggle, reusing the shared field styling so
 * it reads as the same control as the rest of the app. `autoComplete` is passed
 * through so password managers can offer to save ("new-password") or fill
 * ("current-password") at the right moments.
 */
export const PasswordInput: React.FC<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: "new-password" | "current-password";
  /** Submit when Enter is pressed in the field. */
  onSubmit?: () => void;
}> = ({ id, value, onChange, placeholder, autoComplete, onSubmit }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit();
        }}
        className={cn(FIELD_CLASS, "pr-16")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
};
