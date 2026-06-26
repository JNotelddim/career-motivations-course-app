// Advisory password-strength heuristic for the backup flow. Deliberately
// hand-rolled (no zxcvbn/WASM dep — same restraint as the crypto choices): the
// security of a backup rests entirely on the password, but a heavyweight
// estimator buys little over "long + varied" guidance here.
//
// `acceptable` is the only hard gate (a minimum length); `score`/`label` are
// purely informational, in keeping with the app's advisory-not-blocking ethos.

/** Hard floor for enabling a backup. Below this, the meter reads "too short". */
export const MIN_PASSWORD_LENGTH = 12;

export type PasswordStrength = {
  /** 0..4, for the meter fill. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Whether the password clears the minimum bar to enable backup. */
  acceptable: boolean;
};

export function passwordStrength(password: string): PasswordStrength {
  const length = password.length;

  if (length === 0) return { score: 0, label: "Enter a password", acceptable: false };
  if (length < MIN_PASSWORD_LENGTH) {
    return { score: 1, label: `Too short — use at least ${MIN_PASSWORD_LENGTH}`, acceptable: false };
  }

  // Acceptable from here. Reward length and character variety toward "strong".
  let variety = 0;
  if (/[a-z]/.test(password)) variety++;
  if (/[A-Z]/.test(password)) variety++;
  if (/\d/.test(password)) variety++;
  if (/[^A-Za-z0-9]/.test(password)) variety++;

  let score: 2 | 3 | 4 = 2;
  if (length >= 16 || variety >= 3) score = 3;
  if (length >= 20 && variety >= 3) score = 4;

  const label = score === 4 ? "Strong" : score === 3 ? "Good" : "Fair";
  return { score, label, acceptable: true };
}
