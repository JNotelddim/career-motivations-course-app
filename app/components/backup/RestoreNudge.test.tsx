// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { localAnswersEmpty, shouldOfferRestore } from "~/components/backup/RestoreNudge";
import { createSitesDbMock, type CollectionStore } from "~/components/dev/sitesDbMock";
import { encrypt } from "~/lib/backup/crypto";
import { buildProgressSnapshot } from "~/lib/backup/snapshot";
import { upsertBackup } from "~/lib/backup/store";
import type { SitesDb, SitesDoc } from "~/lib/sitesDb";

const EMAIL = "viewer@example.com";

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

const seedBackup = () =>
  encrypt("{}", "a-strong-password").then((envelope) =>
    upsertBackup(db, EMAIL, { envelope, progress: buildProgressSnapshot({}) }),
  );

beforeEach(() => {
  localStorage.clear();
  db = createSitesDbMock({ authorEmail: EMAIL }, new MemoryStore());
});

describe("localAnswersEmpty", () => {
  it("is true when answers are absent, empty, or unparseable", () => {
    expect(localAnswersEmpty()).toBe(true); // absent
    localStorage.setItem("answers", "{}");
    expect(localAnswersEmpty()).toBe(true); // empty object
    localStorage.setItem("answers", "not json");
    expect(localAnswersEmpty()).toBe(true); // unreadable
  });

  it("is false when answers exist", () => {
    localStorage.setItem("answers", JSON.stringify({ "m01-q": { isComplete: true } }));
    expect(localAnswersEmpty()).toBe(false);
  });
});

describe("shouldOfferRestore", () => {
  it("offers the backup when local is empty and a backup exists", async () => {
    await seedBackup();
    const result = await shouldOfferRestore(db, EMAIL);
    expect(result).not.toBeNull();
    expect(result!.updatedAt).toBeTruthy();
  });

  it("does not offer when local already has answers (nothing to recover)", async () => {
    await seedBackup();
    localStorage.setItem("answers", JSON.stringify({ "m01-q": { isComplete: true } }));
    expect(await shouldOfferRestore(db, EMAIL)).toBeNull();
  });

  it("does not offer when no backup exists", async () => {
    expect(await shouldOfferRestore(db, EMAIL)).toBeNull();
  });
});
