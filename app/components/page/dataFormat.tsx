import { useNavigate } from "react-router";

import { Banner, Button } from "~/components/base";
import { ExerciseKind, MODULES } from "~/consts/modules";
import { ROUTES } from "~/consts/routes";
import {
  ANSWERS_FORMAT,
  ANSWERS_PAYLOAD_VERSION,
  MAX_IMPORT_BYTES,
} from "~/lib/transfer/format";

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-800">{children}</code>
);

const Pre: React.FC<{ children: string }> = ({ children }) => (
  <div className="overflow-x-auto rounded-md border border-gray-200 bg-gray-50">
    <pre className="p-4 text-xs leading-relaxed text-gray-800">{children}</pre>
  </div>
);

const KIND_VALUE: Record<ExerciseKind, string> = {
  [ExerciseKind.SHORT_TEXT]: "string",
  [ExerciseKind.LONG_TEXT]: "string",
  [ExerciseKind.MATRIX]: 'Record<string,string> — cells keyed "rowIndex::columnId"',
  [ExerciseKind.ROW_LIST]: "Array<{ id: string, values: Record<string,string> }>",
};

const WRAPPER_EXAMPLE = `{
  "format": "${ANSWERS_FORMAT}",
  "version": ${ANSWERS_PAYLOAD_VERSION},
  "exportedAt": "2026-06-30T12:00:00.000Z",
  "answers": {
    "m01-question": {
      "kind": "shortText",
      "value": "Whether to deepen craft or move toward leading.",
      "isComplete": true,
      "created": "2026-06-25T10:00:00.000Z",
      "lastEdited": "2026-06-25T10:15:00.000Z"
    }
  }
}`;

/**
 * Reference page describing the import/export JSON format. The per-exercise id
 * list is GENERATED from the MODULES const (the single source of truth), so it
 * can never drift from what the importer actually accepts.
 */
export function DataFormat() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-6 p-8">
      <div className="flex w-full">
        <Button onClick={() => navigate(ROUTES.account)}>← Account</Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Answers file format</h1>
        <p className="mt-2 text-gray-600">
          What a valid import/export file looks like. Exporting from the account page produces
          exactly this shape; importing expects it.
        </p>
      </div>

      <section className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold">The file</h2>
        <p className="text-sm text-gray-700">
          A JSON object with a <Code>format</Code> marker, a <Code>version</Code>, an{" "}
          <Code>exportedAt</Code> timestamp, and an <Code>answers</Code> map keyed by exercise id.
        </p>
        <Pre>{WRAPPER_EXAMPLE}</Pre>
      </section>

      <section className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold">Each answer</h2>
        <p className="text-sm text-gray-700">
          Every entry carries its <Code>kind</Code>, a <Code>value</Code> whose shape depends on
          that kind, an <Code>isComplete</Code> flag, and ISO <Code>created</Code> /{" "}
          <Code>lastEdited</Code> timestamps.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="py-2 pr-4 font-medium">kind</th>
                <th className="py-2 font-medium">value shape</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(ExerciseKind).map((kind) => (
                <tr key={kind} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-4">
                    <Code>{kind}</Code>
                  </td>
                  <td className="py-2 text-gray-700">{KIND_VALUE[kind]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold">Validation</h2>
        <Banner tone="neutral" icon="ℹ️">
          Import is strict and all-or-nothing. The whole file is rejected if it isn't valid JSON in
          this shape, if its <Code>version</Code> is newer than this app understands, if any answer
          references an <strong>unknown exercise id</strong>, or if any answer's <Code>kind</Code>{" "}
          doesn't match its exercise. Files are limited to{" "}
          {Math.round(MAX_IMPORT_BYTES / (1024 * 1024))} MB.
        </Banner>
      </section>

      <section className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold">Valid exercise ids</h2>
        <p className="text-sm text-gray-700">
          Answers are keyed by these stable ids. An <Code>answers</Code> map may include any subset;
          unknown ids cause the file to be rejected.
        </p>
        {MODULES.map((module) => (
          <div key={module.id} className="flex w-full flex-col gap-1">
            <h3 className="text-sm font-semibold">
              {module.id}. {module.title}
            </h3>
            <ul className="flex flex-col gap-0.5 pl-1">
              {module.sections
                .flatMap((section) => section.exercises)
                .map((exercise) => (
                  <li key={exercise.id} className="text-xs text-gray-700">
                    <Code>{exercise.id}</Code>{" "}
                    <span className="text-gray-500">
                      — {exercise.kind}
                      {exercise.optional ? " (optional)" : ""}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
