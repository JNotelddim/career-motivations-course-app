import { beforeEach, describe, expect, it } from "vitest";

import { createSitesDbMock, type CollectionStore } from "~/components/dev/sitesDbMock";
import { encrypt } from "~/lib/backup/crypto";
import { PROGRESS_SNAPSHOT_VERSION, type BackupProgressSnapshot } from "~/lib/backup/snapshot";
import {
  BACKUP_COLLECTION,
  CorruptBackupError,
  loadBackup,
  upsertBackup,
} from "~/lib/backup/store";
import type { SitesDb, SitesDoc } from "~/lib/sitesDb";

// In-memory backing store so the mock runs without localStorage (vitest node env).
class MemoryStore implements CollectionStore {
  private data = new Map<string, SitesDoc[]>();
  async readAll(collection: string) {
    return this.data.get(collection) ?? [];
  }
  async writeAll(collection: string, docs: SitesDoc[]) {
    this.data.set(collection, docs);
  }
  async listCollections() {
    return [...this.data.keys()];
  }
}

const ALICE = "alice@example.com";
const BOB = "bob@example.com";

const snapshot: BackupProgressSnapshot = {
  version: PROGRESS_SNAPSHOT_VERSION,
  modules: { "1": { requiredDone: 2, requiredTotal: 3 } },
};

let store: MemoryStore;
let aliceDb: SitesDb;

beforeEach(() => {
  store = new MemoryStore();
  aliceDb = createSitesDbMock({ authorEmail: ALICE }, store);
});

async function makeFields() {
  return { envelope: await encrypt("{}", "password"), progress: snapshot };
}

describe("loadBackup", () => {
  it("returns null when the user has no backup", async () => {
    expect(await loadBackup(aliceDb, ALICE)).toBeNull();
  });

  it("returns the stored backup with server metadata", async () => {
    const fields = await makeFields();
    await upsertBackup(aliceDb, ALICE, fields);

    const loaded = await loadBackup(aliceDb, ALICE);
    expect(loaded).not.toBeNull();
    expect(loaded!.envelope).toEqual(fields.envelope);
    expect(loaded!.progress).toEqual(snapshot);
    expect(loaded!.id).toBeTruthy();
    expect(loaded!.updatedAt).toBeTruthy();
  });

  it("throws CorruptBackupError on a malformed stored document", async () => {
    await aliceDb.collection(BACKUP_COLLECTION).create({ envelope: "not an envelope" });
    await expect(loadBackup(aliceDb, ALICE)).rejects.toBeInstanceOf(CorruptBackupError);
  });
});

describe("upsertBackup", () => {
  it("creates then replaces in place — one doc per user", async () => {
    const first = await upsertBackup(aliceDb, ALICE, await makeFields());
    const second = await upsertBackup(aliceDb, ALICE, await makeFields());

    // Same document id (updated in place), not a second row.
    expect(second.id).toBe(first.id);
    const all = await aliceDb.collection(BACKUP_COLLECTION).list();
    expect(all).toHaveLength(1);
  });

  it("scopes backups per author_email", async () => {
    const bobDb = createSitesDbMock({ authorEmail: BOB }, store);
    await upsertBackup(aliceDb, ALICE, await makeFields());

    // Bob shares the collection but has no backup of his own.
    expect(await loadBackup(bobDb, BOB)).toBeNull();

    await upsertBackup(bobDb, BOB, await makeFields());
    expect(await aliceDb.collection(BACKUP_COLLECTION).list()).toHaveLength(2);
    // Alice still resolves to her own doc, not Bob's.
    const alice = await loadBackup(aliceDb, ALICE);
    expect(alice!.id).toBeTruthy();
  });
});
