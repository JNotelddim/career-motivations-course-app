import { useState } from "react";

import { Banner, Button } from "~/components/base";
import { useAnswerState } from "~/components/providers/answerStateProvider";
import { ANSWERS_STORAGE_KEY } from "~/lib/answers";
import { buildExportPayload, exportFilename } from "~/lib/transfer/format";

/**
 * "Download answers" — exports the stored answers as a JSON file in the versioned
 * round-trip format (re-importable on another browser/device). The file is
 * PLAINTEXT, unlike the encrypted backup, so it carries a loud warning.
 *
 * Reads the raw localStorage string (the exact stored shape) rather than the
 * provider's revived state, so export == precisely what's persisted.
 */
export const ExportCard: React.FC = () => {
  const { answers } = useAnswerState();
  const answerCount = Object.keys(answers).length;
  const hasAnswers = answerCount > 0;

  const [justExported, setJustExported] = useState(false);

  const handleExport = () => {
    const raw = localStorage.getItem(ANSWERS_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const payload = buildExportPayload(stored, new Date().toISOString());

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFilename(new Date());
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setJustExported(true);
  };

  return (
    <section className="flex w-full flex-col gap-3 rounded-lg border border-gray-200 p-5">
      <div>
        <h2 className="text-lg font-semibold">Export answers</h2>
        <p className="text-sm text-gray-600">
          {hasAnswers
            ? `Download your ${answerCount} saved ${answerCount === 1 ? "answer" : "answers"} as a JSON file you can re-import later or on another device.`
            : "You don't have any saved answers to export yet."}
        </p>
      </div>

      <Banner tone="warning" icon="⚠️">
        This file is <strong>not encrypted</strong> — it contains your answers in plain text, and
        anyone who opens it can read them. For a secure copy, use the encrypted backup above.
      </Banner>

      <div>
        <Button onClick={handleExport} disabled={!hasAnswers}>
          Download answers (.json)
        </Button>
      </div>

      {justExported && (
        <Banner tone="info" icon="✅">
          Your answers file is downloading. Keep it somewhere safe.
        </Banner>
      )}
    </section>
  );
};
