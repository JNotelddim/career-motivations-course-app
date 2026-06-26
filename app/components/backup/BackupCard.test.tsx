// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

import { BackupCard } from "~/components/backup/BackupCard";
import { createSitesDbMock, type CollectionStore } from "~/components/dev/sitesDbMock";
import { AnswerStateProvider } from "~/components/providers/answerStateProvider";
import { encrypt } from "~/lib/backup/crypto";
import { buildProgressSnapshot } from "~/lib/backup/snapshot";
import { upsertBackup } from "~/lib/backup/store";
import type { SitesDb, SitesDoc } from "~/lib/sitesDb";

const EMAIL = "viewer@example.com";

// In-memory backing store so the mock doesn't depend on localStorage for the
// "server" side (jsdom provides localStorage, but keeping the DB separate makes
// the race the only thing under test).
class MemoryStore implements CollectionStore {
  private data = new Map<string, SitesDoc[]>();
  async readAll(c: string) {
    return this.data.get(c) ?? [];
  }
  async writeAll(c: string, docs: SitesDoc[]) {
    this.data.set(c, docs);
  }
  async listCollections() {
    return [...this.data.keys()];
  }
}

let db: SitesDb;

beforeEach(async () => {
  localStorage.clear();
  window.sites = undefined;
  db = createSitesDbMock({ authorEmail: EMAIL }, new MemoryStore());
  // Seed an existing backup, as if the user had already backed up before.
  await upsertBackup(db, EMAIL, {
    envelope: await encrypt("{}", "a-strong-password"),
    progress: buildProgressSnapshot({}),
  });
});

afterEach(() => {
  cleanup();
  window.sites = undefined;
});

const renderCard = () =>
  render(
    <AnswerStateProvider>
      <BackupCard email={EMAIL} />
    </AnswerStateProvider>,
  );

describe("BackupCard — window.sites.db readiness", () => {
  it("reflects the existing backup even when db attaches AFTER mount (the race the fix addresses)", async () => {
    // Mount before the SDK is ready — exactly the post-restore hard-reload window.
    renderCard();
    expect(screen.getByText(/haven't backed up yet/i)).toBeTruthy();

    // The mock attaches db asynchronously, after auth has already resolved.
    window.sites = { user: async () => null, db };

    // The card must poll for db, find it, and surface the existing backup —
    // before the fix it stayed on "haven't backed up yet" indefinitely.
    await waitFor(() => expect(screen.getByText(/Last backed up/i)).toBeTruthy());
    expect(screen.queryByText(/haven't backed up yet/i)).toBeNull();
  });

  it("reflects the existing backup when db is already attached at mount", async () => {
    window.sites = { user: async () => null, db };
    renderCard();
    await waitFor(() => expect(screen.getByText(/Last backed up/i)).toBeTruthy());
  });
});
