import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { Banner, Button } from "~/components/base";
import { useAuth } from "~/components/providers/authProvider";
import { ROUTES } from "~/consts/routes";
import { loadBackup, type StoredBackup } from "~/lib/backup/store";
import { waitForSitesDb } from "./waitForSitesDb";

/** Session-scoped so a dismissal sticks across navigations/reloads but not forever. */
const DISMISS_KEY = "restore-nudge-dismissed";

/**
 * Is this browser's answer state empty? Read straight from localStorage (not the
 * AnswerStateProvider) so we judge the persisted truth, not the provider's
 * pre-hydration `{}` — which would otherwise false-positive on first render.
 */
export function localAnswersEmpty(): boolean {
  try {
    const raw = localStorage.getItem("answers");
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return !parsed || Object.keys(parsed).length === 0;
  } catch {
    // Unreadable answers are effectively no answers — a restore would help.
    return true;
  }
}

/**
 * The nudge condition: offer a restore only when there's nothing to lose locally
 * AND a backup actually exists to restore from. Returns the backup (for its date)
 * or null. A corrupt/unreadable backup yields null — restoring it would fail, so
 * nudging toward it would be cruel.
 */
export async function shouldOfferRestore(
  db: import("~/lib/sitesDb").SitesDb,
  email: string,
): Promise<StoredBackup | null> {
  if (!localAnswersEmpty()) return null;
  try {
    return await loadBackup(db, email);
  } catch {
    return null;
  }
}

/**
 * Sign-in restore nudge: on a device with no local answers but an existing
 * backup (new device, cleared browser), surface a dismissible prompt to restore.
 * Mounted in the app shell so it greets the user wherever they land after sign-in.
 */
export const RestoreNudge: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [backup, setBackup] = useState<StoredBackup | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const email = auth.status === "authenticated" ? auth.user.email : null;

  useEffect(() => {
    if (!email) return;
    if (sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }

    let cancelled = false;
    waitForSitesDb()
      .then((db) => {
        if (cancelled || !db) return;
        return shouldOfferRestore(db, email).then((found) => {
          if (!cancelled) setBackup(found);
        });
      })
      .catch(() => {
        // Best-effort nudge — never surface its own failure to the user.
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  // The account page already shows the restore UI; no need to nudge there.
  if (!backup || dismissed || location.pathname === ROUTES.account) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <Banner tone="info" icon="💾" className="rounded-none border-x-0 border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          This browser has no saved answers, but your account has an encrypted backup from{" "}
          {new Date(backup.updatedAt).toLocaleDateString()}. Restore it to pick up where you
          left off.
        </span>
        <span className="flex shrink-0 gap-2">
          <Button onClick={() => navigate(ROUTES.account, { state: { openRestore: true } })}>
            Restore
          </Button>
          <Button onClick={dismiss}>Dismiss</Button>
        </span>
      </div>
    </Banner>
  );
};
