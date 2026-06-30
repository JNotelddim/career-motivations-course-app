// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// Mock the destructive primitive so the happy path doesn't trigger a real
// reload/navigation (unimplemented in jsdom); we just assert it's invoked.
vi.mock("~/lib/answers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/lib/answers")>();
  return { ...actual, applyAnswers: vi.fn() };
});

import { ImportCard } from "~/components/transfer/ImportCard";
import { AnswerStateProvider } from "~/components/providers/answerStateProvider";
import { applyAnswers } from "~/lib/answers";
import { ExerciseKind, MODULES } from "~/consts/modules";
import { ANSWERS_FORMAT, ANSWERS_PAYLOAD_VERSION } from "~/lib/transfer/format";

const SHORT_ID = MODULES.flatMap((m) => m.sections.flatMap((s) => s.exercises)).find(
  (e) => e.kind === ExerciseKind.SHORT_TEXT,
)!.id;

const validFileText = (): string =>
  JSON.stringify({
    format: ANSWERS_FORMAT,
    version: ANSWERS_PAYLOAD_VERSION,
    exportedAt: "2026-06-30T12:00:00.000Z",
    answers: {
      [SHORT_ID]: {
        kind: ExerciseKind.SHORT_TEXT,
        value: "Imported answer",
        isComplete: true,
        created: "2026-06-25T10:00:00.000Z",
        lastEdited: "2026-06-25T10:15:00.000Z",
      },
    },
  });

beforeEach(() => {
  localStorage.clear();
  vi.mocked(applyAnswers).mockClear();
});

afterEach(cleanup);

const openCard = () => {
  const { container } = render(
    <AnswerStateProvider>
      <ImportCard />
    </AnswerStateProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /import answers/i }));
  return container.querySelector('input[type="file"]') as HTMLInputElement;
};

const uploadText = (input: HTMLInputElement, text: string, name = "answers.json") => {
  const file = new File([text], name, { type: "application/json" });
  fireEvent.change(input, { target: { files: [file] } });
};

describe("ImportCard", () => {
  it("applies a valid file when nothing local would be lost", async () => {
    const input = openCard();
    uploadText(input, validFileText());

    await waitFor(() => expect(applyAnswers).toHaveBeenCalledTimes(1));
    const written = JSON.parse(vi.mocked(applyAnswers).mock.calls[0][0]);
    expect(written[SHORT_ID].value).toBe("Imported answer");
  });

  it("shows a malformed-file error and does not apply", async () => {
    const input = openCard();
    uploadText(input, "not json {");

    await waitFor(() => expect(screen.getByText(/isn't a valid answers export/i)).toBeTruthy());
    expect(applyAnswers).not.toHaveBeenCalled();
  });

  it("shows an unknown-id error and does not apply", async () => {
    const input = openCard();
    uploadText(
      input,
      JSON.stringify({
        format: ANSWERS_FORMAT,
        version: ANSWERS_PAYLOAD_VERSION,
        exportedAt: "2026-06-30T12:00:00.000Z",
        answers: {
          "m99-does-not-exist": {
            kind: ExerciseKind.SHORT_TEXT,
            value: "orphan",
            isComplete: true,
            created: "2026-06-25T10:00:00.000Z",
            lastEdited: "2026-06-25T10:15:00.000Z",
          },
        },
      }),
    );

    await waitFor(() => expect(screen.getByText(/don't exist in this version/i)).toBeTruthy());
    expect(applyAnswers).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON file extension without reading it", async () => {
    const input = openCard();
    const file = new File(["whatever"], "answers.txt", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText(/choose a \.json file/i)).toBeTruthy());
    expect(applyAnswers).not.toHaveBeenCalled();
  });
});
