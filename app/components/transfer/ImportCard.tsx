import { useState } from "react";
import cn from "classnames";

import { MODULES } from "~/consts/modules";
import { Banner, Button } from "~/components/base";
import { useAnswerState } from "~/components/providers/answerStateProvider";
import { applyAnswers } from "~/lib/answers";
import { buildProgressSnapshot, compareProgress, type ModuleRegression } from "~/lib/backup/snapshot";
import {
  MAX_IMPORT_BYTES,
  MalformedImportError,
  parseImportFile,
  UnknownExerciseIdError,
  UnsupportedImportVersionError,
  type AnswerFileValue,
} from "~/lib/transfer/format";

type Status = "idle" | "reading" | "confirm" | "error";

const moduleTitle = (id: number) => MODULES.find((m) => m.id === id)?.title ?? `Module ${id}`;

/** The three typed parse errors already carry legible, distinct messages; fall
 *  back for anything unexpected (e.g. a FileReader failure). */
const importErrorMessage = (error: unknown): string => {
  if (
    error instanceof MalformedImportError ||
    error instanceof UnsupportedImportVersionError ||
    error instanceof UnknownExerciseIdError
  ) {
    return error.message;
  }
  return "Something went wrong reading that file. Please try again.";
};

/**
 * "Import answers" — load a previously exported JSON file and replace local
 * answers with it. Mirrors RestoreCard's destructive flow (the source is a file
 * instead of a decrypted backup): strict validate → overwrite guard → confirm →
 * applyAnswers. Inline expanding card to match the account page's other cards.
 */
export const ImportCard: React.FC = () => {
  const { answers } = useAnswerState();

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, setPending] = useState<{
    answers: Record<string, AnswerFileValue>;
    regressions: ModuleRegression[];
  } | null>(null);

  const reset = () => {
    setStatus("idle");
    setError(null);
    setPending(null);
    setDragOver(false);
    setOpen(false);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setPending(null);

    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      setError("Please choose a .json file.");
      setStatus("error");
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError("That file is too large to be an answers export (max 2 MB).");
      setStatus("error");
      return;
    }

    setStatus("reading");
    let parsed: ReturnType<typeof parseImportFile>;
    try {
      const text = await file.text();
      parsed = parseImportFile(text);
    } catch (e) {
      setError(importErrorMessage(e));
      setStatus("error");
      return;
    }

    // Overwrite guard — same comparison as restore, pointed at the file: if local
    // is further along than the file, importing would drop that newer work.
    const { regressions, wouldLoseProgress } = compareProgress(
      buildProgressSnapshot(parsed.answers),
      buildProgressSnapshot(answers),
    );
    if (wouldLoseProgress) {
      setPending({ answers: parsed.answers, regressions });
      setStatus("confirm");
      return;
    }

    applyAnswers(JSON.stringify(parsed.answers));
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so re-selecting the same file fires onChange again.
    event.target.value = "";
    if (file) void handleFile(file);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <section className="flex w-full flex-col gap-3 rounded-lg border border-gray-200 p-5">
      <div>
        <h2 className="text-lg font-semibold">Import answers</h2>
        <p className="text-sm text-gray-600">
          Load a previously exported answers file. This replaces the answers in this browser.
        </p>
      </div>

      {!open ? (
        <div>
          <Button onClick={() => setOpen(true)}>Import answers</Button>
        </div>
      ) : status === "confirm" && pending ? (
        <div className="flex flex-col gap-4">
          <Banner tone="warning" icon="⚠️">
            <p className="font-medium">This will overwrite more recent work.</p>
            <p className="mt-1">
              Your current answers are further along than this file in these modules — importing
              will lose that newer progress:
            </p>
            <ul className="mt-2 list-disc pl-5">
              {pending.regressions.map((r) => (
                <li key={r.moduleId}>
                  {moduleTitle(r.moduleId)} — file has {r.snapshotDone}/{r.requiredTotal} done, you
                  currently have {r.currentDone}/{r.requiredTotal}.
                </li>
              ))}
            </ul>
          </Banner>
          <div className="flex gap-2">
            <Button onClick={() => applyAnswers(JSON.stringify(pending.answers))}>
              Overwrite anyway
            </Button>
            <Button onClick={reset}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Banner tone="warning" icon="⚠️">
            Importing <strong>replaces</strong> all answers in this browser with the file's
            contents. Consider exporting or backing up first.
          </Banner>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-8 text-center text-sm transition-colors",
              dragOver
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-gray-300 text-gray-600 hover:border-gray-400",
            )}
          >
            <span className="font-medium">
              {status === "reading" ? "Reading…" : "Drop your .json file here, or click to choose"}
            </span>
            <span className="text-xs text-gray-500">Exported answers file, up to 2 MB</span>
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={onInputChange}
              disabled={status === "reading"}
            />
          </label>

          {error && status === "error" && (
            <Banner tone="warning" icon="⚠️">
              {error}
            </Banner>
          )}

          <div>
            <Button onClick={reset} disabled={status === "reading"}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};
