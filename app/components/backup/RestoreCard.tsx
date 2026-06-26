import { useState } from "react";
import { useLocation } from "react-router";

import { MODULES } from "~/consts/modules";
import { Banner, Button } from "~/components/base";
import { useAnswerState } from "~/components/providers/answerStateProvider";
import {
  decrypt,
  UnsupportedBackupVersionError,
  WrongPasswordError,
} from "~/lib/backup/crypto";
import {
  buildProgressSnapshot,
  compareProgress,
  type ModuleRegression,
} from "~/lib/backup/snapshot";
import { CorruptBackupError, loadBackup } from "~/lib/backup/store";
import { PasswordInput } from "./PasswordInput";
import { waitForSitesDb } from "./waitForSitesDb";

type Status = "idle" | "loading" | "confirm" | "error";

const moduleTitle = (id: number) => MODULES.find((m) => m.id === id)?.title ?? `Module ${id}`;

/**
 * "Restore from backup" flow: decrypt with the password, then — before
 * overwriting anything — compare the backup's progress against the current
 * local state. If restoring would drop more-complete local work, require an
 * explicit confirmation listing exactly which modules are at risk.
 *
 * Applying a restore replaces the answers wholesale and reloads, so the app
 * re-derives all progress from the restored answers.
 */
export const RestoreCard: React.FC<{ email: string }> = ({ email }) => {
  const { answers } = useAnswerState();
  const location = useLocation();

  // The sign-in restore nudge links here with this state to open the form directly.
  const arrivedToRestore = Boolean((location.state as { openRestore?: boolean } | null)?.openRestore);

  const [open, setOpen] = useState(arrivedToRestore);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ answersJson: string; regressions: ModuleRegression[] } | null>(
    null,
  );

  const applyRestore = (answersJson: string) => {
    localStorage.setItem("answers", answersJson);
    // Full reload so every consumer re-reads the restored answers from scratch.
    window.location.reload();
  };

  const handleRestore = async () => {
    const db = await waitForSitesDb();
    if (!db) {
      setError("Restore isn't available right now. Try reloading the page.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const stored = await loadBackup(db, email);
      if (!stored) {
        setError("We couldn't find a backup for your account.");
        setStatus("error");
        return;
      }

      const answersJson = await decrypt(stored.envelope, password);

      const { regressions, wouldLoseProgress } = compareProgress(
        stored.progress,
        buildProgressSnapshot(answers),
      );
      if (wouldLoseProgress) {
        // Don't overwrite yet — surface what would be lost and make the user confirm.
        setPending({ answersJson, regressions });
        setStatus("confirm");
        return;
      }

      applyRestore(answersJson);
    } catch (e) {
      if (e instanceof WrongPasswordError) {
        setError("That password didn't unlock the backup. Double-check it and try again.");
      } else if (e instanceof CorruptBackupError) {
        setError("Your stored backup appears to be corrupted and can't be restored.");
      } else if (e instanceof UnsupportedBackupVersionError) {
        setError(e.message);
      } else {
        setError("Something went wrong while restoring. Please try again.");
      }
      setStatus("error");
    }
  };

  const cancel = () => {
    setPassword("");
    setPending(null);
    setStatus("idle");
    setError(null);
    setOpen(false);
  };

  return (
    <section className="flex w-full flex-col gap-3 rounded-lg border border-gray-200 p-5">
      <div>
        <h2 className="text-lg font-semibold">Restore from backup</h2>
        <p className="text-sm text-gray-600">
          Replace the answers in this browser with your encrypted backup.
        </p>
      </div>

      {!open ? (
        <div>
          <Button onClick={() => setOpen(true)}>Restore from backup</Button>
        </div>
      ) : status === "confirm" && pending ? (
        <div className="flex flex-col gap-4">
          <Banner tone="warning" icon="⚠️">
            <p className="font-medium">This will overwrite more recent work.</p>
            <p className="mt-1">
              Your backup is behind your current answers in these modules — restoring will lose
              that newer progress:
            </p>
            <ul className="mt-2 list-disc pl-5">
              {pending.regressions.map((r) => (
                <li key={r.moduleId}>
                  {moduleTitle(r.moduleId)} — backup has {r.snapshotDone}/{r.requiredTotal} done,
                  you currently have {r.currentDone}/{r.requiredTotal}.
                </li>
              ))}
            </ul>
          </Banner>
          <div className="flex gap-2">
            <Button onClick={() => applyRestore(pending.answersJson)}>Overwrite anyway</Button>
            <Button onClick={cancel}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="restore-password" className="text-sm font-medium">
              Backup password
            </label>
            <PasswordInput
              id="restore-password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="The password you backed up with"
              onSubmit={password.length > 0 && status !== "loading" ? handleRestore : undefined}
            />
          </div>

          {error && status === "error" && (
            <Banner tone="warning" icon="⚠️">
              {error}
            </Banner>
          )}

          <div className="flex gap-2">
            <Button onClick={handleRestore} disabled={password.length === 0 || status === "loading"}>
              {status === "loading" ? "Decrypting…" : "Restore"}
            </Button>
            <Button onClick={cancel} disabled={status === "loading"}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
