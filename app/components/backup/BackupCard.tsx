import { useEffect, useState } from "react";

import { Banner, Button, ProgressBar } from "~/components/base";
import { useAnswerState } from "~/components/providers/answerStateProvider";
import { encrypt } from "~/lib/backup/crypto";
import { MIN_PASSWORD_LENGTH, passwordStrength } from "~/lib/backup/passwordStrength";
import { buildProgressSnapshot, compareProgress } from "~/lib/backup/snapshot";
import { loadBackup, upsertBackup, type StoredBackup } from "~/lib/backup/store";
import { PasswordInput } from "./PasswordInput";
import { waitForSitesDb } from "./waitForSitesDb";

type Status = "idle" | "saving" | "error";

/**
 * "Back up now" flow: an irreversibility acknowledgement gate, then a
 * confirm-password pair with a live strength meter. Encrypts the raw localStorage
 * answers blob and upserts the user's single backup document.
 *
 * Styling leans on the shared base components / tokens; final visual polish is a
 * Realm 4 (design) pass for Jared.
 */
export const BackupCard: React.FC<{ email: string }> = ({ email }) => {
  const { answers } = useAnswerState();

  const [existing, setExisting] = useState<StoredBackup | null>(null);
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Load any existing backup once, to show its age and the staleness nudge.
  // Waits for `window.sites.db` to attach — reading it synchronously here races
  // the mock's async db attach, which would leave this stuck on "no backup".
  useEffect(() => {
    let cancelled = false;
    waitForSitesDb()
      .then((db) => {
        if (cancelled || !db) return;
        return loadBackup(db, email).then((backup) => {
          if (!cancelled) setExisting(backup);
        });
      })
      .catch(() => {
        // A corrupt existing backup shouldn't block making a fresh one; the
        // restore card surfaces corruption. Leave `existing` null here.
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const strength = passwordStrength(password);
  const matches = password.length > 0 && password === confirm;
  const canSubmit = acknowledged && strength.acceptable && matches && status !== "saving";

  // Has local progress moved ahead of the last backup? (Same comparison the
  // restore guard uses, pointed the other way.) Only meaningful once backed up.
  const isStale =
    existing !== null &&
    compareProgress(existing.progress, buildProgressSnapshot(answers)).wouldLoseProgress;

  const resetForm = () => {
    setPassword("");
    setConfirm("");
    setAcknowledged(false);
    setOpen(false);
  };

  const handleBackUp = async () => {
    const db = await waitForSitesDb();
    if (!db) {
      setError("Backup isn't available right now. Try reloading the page.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      // The exact localStorage string is what restore writes back, verbatim.
      const answersJson = localStorage.getItem("answers") ?? "{}";
      const envelope = await encrypt(answersJson, password);
      const saved = await upsertBackup(db, email, {
        envelope,
        progress: buildProgressSnapshot(answers),
      });
      setExisting(saved);
      setStatus("idle");
      resetForm();
    } catch {
      setError("Something went wrong while backing up. Your data is unchanged — please try again.");
      setStatus("error");
    }
  };

  return (
    <section className="flex w-full flex-col gap-3 rounded-lg border border-gray-200 p-5">
      <div>
        <h2 className="text-lg font-semibold">Encrypted backup</h2>
        <p className="text-sm text-gray-600">
          {existing
            ? `Last backed up ${new Date(existing.updatedAt).toLocaleString()}.`
            : "You haven't backed up yet."}
        </p>
      </div>

      <Banner tone="warning" icon="⚠️">
        Your answers live only in this browser. Clear your history or switch devices and
        they're gone. A backup stores an <strong>encrypted</strong> copy you can restore with
        your password.
      </Banner>

      {isStale && (
        <Banner tone="info" icon="🔄">
          You've made progress since your last backup. Back up again to keep it safe.
        </Banner>
      )}

      {!open ? (
        <div>
          <Button onClick={() => setOpen(true)}>
            {existing ? "Back up again" : "Back up now"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Banner tone="warning" icon="🔑">
            Your password is the <strong>only</strong> way to unlock this backup. We can't
            reset it or recover your data without it — if you lose the password, the backup is
            gone for good. Use a password manager.
          </Banner>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span>
              I understand that losing this password means permanently losing access to this
              backup.
            </span>
          </label>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="backup-password" className="text-sm font-medium">
              Password
            </label>
            <PasswordInput
              id="backup-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            />
            {password.length > 0 && (
              <div className="flex items-center gap-2">
                <ProgressBar
                  value={strength.score / 4}
                  complete={strength.score === 4}
                  label={`Password strength: ${strength.label}`}
                  className="max-w-40"
                />
                <span className="text-xs text-gray-600">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="backup-confirm" className="text-sm font-medium">
              Confirm password
            </label>
            <PasswordInput
              id="backup-confirm"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              onSubmit={canSubmit ? handleBackUp : undefined}
            />
            {confirm.length > 0 && !matches && (
              <span className="text-xs text-red-600">Passwords don't match yet.</span>
            )}
          </div>

          {error && status === "error" && (
            <Banner tone="warning" icon="⚠️">
              {error}
            </Banner>
          )}

          <div className="flex gap-2">
            <Button onClick={handleBackUp} disabled={!canSubmit}>
              {status === "saving" ? "Encrypting…" : "Create backup"}
            </Button>
            <Button onClick={resetForm} disabled={status === "saving"}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
