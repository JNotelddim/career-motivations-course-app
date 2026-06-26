import { z } from "zod";

import { type BackupEnvelope, backupEnvelopeSchema } from "~/lib/backup/crypto";
import { type BackupProgressSnapshot, progressSnapshotSchema } from "~/lib/backup/snapshot";
import type { SitesDb } from "~/lib/sitesDb";

// Backup persistence over the Sites Document Database. Deals only in envelopes +
// snapshots — never passwords or plaintext (that's the crypto core's job, one
// layer down). Takes a `SitesDb` by injection rather than reaching for
// `window.sites.db`, so it's testable against the mock with an in-memory store.
//
// Locked design: ONE backup doc per user, UPSERT (no version history in v1).
// The doc is located by querying `author_email` — never a locally remembered
// id, because the whole point is that localStorage may have been wiped.

/** Collection name. Matches the SDK's `^[a-z0-9][a-z0-9_-]{0,62}$` rule. */
export const BACKUP_COLLECTION = "backups";

/** The app-owned fields of a backup document (server adds id/timestamps/author). */
type BackupDocFields = {
  envelope: BackupEnvelope;
  progress: BackupProgressSnapshot;
};

/** A backup as read back from the DB, with the server metadata we care about. */
export type StoredBackup = BackupDocFields & {
  id: string;
  createdAt: string;
  /** ISO timestamp — doubles as "backup age" for staleness prompts. */
  updatedAt: string;
};

/** Thrown when a stored backup document doesn't match the shape we can read. */
export class CorruptBackupError extends Error {
  constructor(detail?: string) {
    super(`The stored backup is corrupted or unreadable${detail ? ` (${detail})` : ""}.`);
    this.name = "CorruptBackupError";
  }
}

const backupDocSchema = z.object({
  envelope: backupEnvelopeSchema,
  progress: progressSnapshotSchema,
});

/** Query the single backup doc id for this user, or undefined if none exists.
 *  Validation-free on purpose — upsert only needs the id, even if the existing
 *  doc's body is somehow corrupt (we're about to overwrite it anyway). */
async function findBackupId(db: SitesDb, authorEmail: string): Promise<string | undefined> {
  const docs = await db
    .collection(BACKUP_COLLECTION)
    .where("author_email", "eq", authorEmail)
    .limit(1)
    .list();
  return docs[0]?.id;
}

/**
 * Load this user's backup, or `null` if they have none. Validates the stored
 * document's shape, throwing `CorruptBackupError` on a malformed body so the UI
 * can react distinctly from "no backup yet".
 */
export async function loadBackup(db: SitesDb, authorEmail: string): Promise<StoredBackup | null> {
  const docs = await db
    .collection(BACKUP_COLLECTION)
    .where("author_email", "eq", authorEmail)
    .limit(1)
    .list();
  const doc = docs[0];
  if (!doc) return null;

  const parsed = backupDocSchema.safeParse(doc);
  if (!parsed.success) {
    throw new CorruptBackupError(parsed.error.issues[0]?.message);
  }

  return {
    id: doc.id,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    envelope: parsed.data.envelope,
    progress: parsed.data.progress,
  };
}

/**
 * Create or replace this user's single backup document. Locates any existing
 * doc by `author_email` and updates it in place; otherwise creates a fresh one.
 */
export async function upsertBackup(
  db: SitesDb,
  authorEmail: string,
  fields: BackupDocFields,
): Promise<StoredBackup> {
  const collection = db.collection(BACKUP_COLLECTION);
  const existingId = await findBackupId(db, authorEmail);

  // `fields` is a plain object of our own making, so the freshly written doc is
  // valid by construction — no need to re-validate what we just serialized.
  const saved = existingId
    ? await collection.update(existingId, fields)
    : await collection.create(fields);

  return {
    id: saved.id,
    createdAt: saved.created_at,
    updatedAt: saved.updated_at,
    envelope: fields.envelope,
    progress: fields.progress,
  };
}
