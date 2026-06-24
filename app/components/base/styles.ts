// Shared appearance tokens for the hand-rolled base controls. One source of
// truth for border weight, radius, padding, and focus affordance so every
// text field reads as the same control regardless of which component renders it.

export const FIELD_CLASS =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 " +
  "placeholder:text-gray-400 transition-colors " +
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";
