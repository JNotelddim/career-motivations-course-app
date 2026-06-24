import cn from "classnames";

/**
 * Inline message block — a callout for context the user should notice but
 * isn't being asked to act on (privacy notes, dev warnings, status).
 *
 * Tone sets the colour semantics only; it carries no layout opinion, so a
 * banner sizes to wherever it's placed (full-width inside a page column by
 * default). `icon` is decorative — keep the meaning in the text.
 */
export type BannerTone = "info" | "warning" | "neutral";

const TONE_STYLES: Record<BannerTone, string> = {
  info: "bg-blue-50 text-blue-900 border-blue-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  neutral: "bg-gray-50 text-gray-700 border-gray-200",
};

export const Banner: React.FC<{
  children: React.ReactNode;
  tone?: BannerTone;
  icon?: React.ReactNode;
  className?: string;
}> = ({ children, tone = "info", icon, className }) => (
  <div
    role="note"
    className={cn(
      "flex w-full items-start gap-2.5 rounded-md border px-4 py-3 text-sm leading-relaxed",
      TONE_STYLES[tone],
      className,
    )}
  >
    {icon && (
      <span aria-hidden className="mt-px shrink-0 text-base leading-none">
        {icon}
      </span>
    )}
    <div className="min-w-0">{children}</div>
  </div>
);
