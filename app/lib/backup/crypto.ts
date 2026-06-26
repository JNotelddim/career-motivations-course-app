import { z } from "zod";

// Encrypted-backup crypto core — PURE & testable. No DOM, no React, no app
// state: it only turns a plaintext string into a self-describing envelope and
// back, given a password. The backup *document* (progress hint, doc-DB wiring)
// is built one layer up; this layer knows nothing about modules or answers.
//
// Locked design (.scratch/TASKS.md, 2026-06-25). Threat model: a read-only
// snooping coworker lifts the ciphertext from the doc DB and brute-forces it
// offline. Defenses are exactly two: a strong user password + a deliberately
// slow KDF. So the choices below are not arbitrary:
//
// - PBKDF2 / 600k iterations / SHA-256 — Web Crypto native, so no WASM/Argon2
//   dependency. Argon2id would be stronger against GPU/ASIC attackers, but the
//   envelope is self-describing (it records its own KDF params), so it's a
//   clean later upgrade — not a now problem for this threat model.
// - AES-256-GCM — authenticated encryption. The GCM auth tag means a wrong
//   password (or any tampering) makes decryption *fail* rather than silently
//   return garbage. That gives us wrong-password detection for free; we never
//   store or compare a password hash.
//
// The envelope is VERSIONED and SELF-DESCRIBING: decrypt reads salt, iterations,
// hash, and IV back *out of the envelope* rather than assuming today's
// constants. That's what lets us change the constants (or swap KDF/cipher)
// later without stranding old backups.

/** Bump when the envelope's *shape* changes incompatibly. Constants (iterations,
 *  etc.) changing is NOT a version bump — they live in the envelope and decrypt
 *  honours whatever it finds there. */
export const BACKUP_ENVELOPE_VERSION = 1;

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_HASH = "SHA-256" as const;
const KDF_ALGORITHM = "PBKDF2" as const;
const CIPHER_ALGORITHM = "AES-256-GCM" as const;

const SALT_BYTES = 16; // 128-bit random salt, per-backup (CSPRNG).
const IV_BYTES = 12; // 96-bit IV — the size AES-GCM is specified/optimized for.
const AES_KEY_BITS = 256; // AES-256 → a 256-*bit* (32-byte) derived key.

// --- Envelope ---------------------------------------------------------------

/**
 * The complete, portable ciphertext record. Everything here is non-secret
 * metadata *except* nothing — the password is never stored, and the key is
 * never persisted. `ciphertext` is the AES-GCM output with its 16-byte auth
 * tag appended (Web Crypto's convention), base64-encoded.
 *
 * Future option (deferred): bind `version` + the kdf/cipher params as GCM
 * additionalData (AAD) so the parameters can't be swapped without failing
 * auth. See the `encrypt`/`decrypt` AAD notes below.
 */
export type BackupEnvelope = {
  version: number;
  kdf: {
    algorithm: typeof KDF_ALGORITHM;
    hash: typeof PBKDF2_HASH;
    iterations: number;
    /** base64, 16 bytes. */
    salt: string;
  };
  cipher: {
    algorithm: typeof CIPHER_ALGORITHM;
    /** base64, 12 bytes. */
    iv: string;
  };
  /** base64; AES-GCM ciphertext with the auth tag appended. */
  ciphertext: string;
};

// Structural guard for envelopes coming back from JSON (doc DB or a file the
// user re-imports). This validates *shape*, not authenticity — authenticity is
// the GCM tag's job at decrypt time. We keep it advisory-strict: a malformed
// envelope should fail loudly *here* with a clear message rather than as a
// cryptic base64/DOMException deep inside `decrypt`.
const base64 = z.string().min(1);

export const backupEnvelopeSchema = z.object({
  version: z.number().int().positive(),
  kdf: z.object({
    algorithm: z.literal(KDF_ALGORITHM),
    hash: z.literal(PBKDF2_HASH),
    iterations: z.number().int().positive(),
    salt: base64,
  }),
  cipher: z.object({
    algorithm: z.literal(CIPHER_ALGORITHM),
    iv: base64,
  }),
  ciphertext: base64,
});

// --- Errors -----------------------------------------------------------------

/** Thrown when decryption fails its auth check. For our threat model the only
 *  realistic causes are a wrong password or a corrupted/tampered envelope — we
 *  deliberately don't distinguish them (we can't, and it doesn't matter to the
 *  user). The UI turns this into one loud, kind message. */
export class WrongPasswordError extends Error {
  constructor() {
    super("Could not decrypt this backup — the password is wrong, or the backup is corrupted.");
    this.name = "WrongPasswordError";
  }
}

/** Thrown when an envelope's structure doesn't match what we know how to read. */
export class MalformedEnvelopeError extends Error {
  constructor(detail?: string) {
    super(`This doesn't look like a valid backup${detail ? ` (${detail})` : ""}.`);
    this.name = "MalformedEnvelopeError";
  }
}

/** Thrown when the envelope is well-formed but newer than this build understands. */
export class UnsupportedBackupVersionError extends Error {
  constructor(version: number) {
    super(
      `This backup was made by a newer version of the app (format v${version}). ` +
        `Update the app to restore it.`,
    );
    this.name = "UnsupportedBackupVersionError";
  }
}

// Web Crypto's `BufferSource` typings require an ArrayBuffer-backed view (not a
// SharedArrayBuffer-backed one). Every byte source below is freshly allocated,
// so pinning to this type is sound — and it keeps the subtle-crypto calls clean
// of casts.
type Bytes = Uint8Array<ArrayBuffer>;

/** UTF-8 encode into a guaranteed ArrayBuffer-backed view (see `Bytes`). */
function utf8(text: string): Bytes {
  return new Uint8Array(new TextEncoder().encode(text));
}

// --- base64 <-> bytes -------------------------------------------------------
// We round-trip raw bytes through base64 to keep the envelope JSON-friendly.
// (Browser-native btoa/atob over a binary string — no Buffer, this is client code.)

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(b64: string): Bytes {
  const binary = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// --- Key derivation ---------------------------------------------------------

/**
 * Stretch a password into a non-extractable AES-256 key via PBKDF2. The key is
 * marked non-extractable: it can encrypt/decrypt but can never be read back out
 * of the CryptoKey, so it can't leak through our own code. Kept private — the
 * tested surface is the encrypt/decrypt round-trip, not the key itself.
 */
async function deriveKey(
  password: string,
  salt: Bytes,
  iterations: number,
  hash: typeof PBKDF2_HASH,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    utf8(password),
    KDF_ALGORITHM,
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    { name: KDF_ALGORITHM, salt, iterations, hash },
    baseKey,
    { name: "AES-GCM", length: AES_KEY_BITS },
    false, // non-extractable
    ["encrypt", "decrypt"],
  );
}

// --- Encrypt / Decrypt ------------------------------------------------------

/**
 * Encrypt `plaintext` under `password`, producing a self-describing envelope.
 * A fresh CSPRNG salt and IV are generated per call (never reuse an IV with the
 * same key — GCM's one hard rule; a new random salt makes that automatic since
 * it yields a fresh key every time).
 */
export async function encrypt(plaintext: string, password: string): Promise<BackupEnvelope> {
  const salt: Bytes = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(SALT_BYTES)));
  const iv: Bytes = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(IV_BYTES)));

  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS, PBKDF2_HASH);

  const ciphertext = await crypto.subtle.encrypt(
    // AAD option (deferred): add `additionalData: <encoded version+params>` here
    // to cryptographically bind the envelope metadata. Must match in `decrypt`.
    { name: "AES-GCM", iv },
    key,
    utf8(plaintext),
  );

  return {
    version: BACKUP_ENVELOPE_VERSION,
    kdf: {
      algorithm: KDF_ALGORITHM,
      hash: PBKDF2_HASH,
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: {
      algorithm: CIPHER_ALGORITHM,
      iv: bytesToBase64(iv),
    },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

/**
 * Decrypt an envelope back to its plaintext. Reads the KDF params and IV *from
 * the envelope* (self-describing — never assumes today's constants), so it can
 * still read backups made under older parameters.
 *
 * Pass a value straight from JSON: it's structurally validated first, so a
 * garbage input fails as a MalformedEnvelopeError, a wrong password as a
 * WrongPasswordError — never a cryptic low-level throw.
 */
export async function decrypt(input: unknown, password: string): Promise<string> {
  const parsed = backupEnvelopeSchema.safeParse(input);
  if (!parsed.success) {
    throw new MalformedEnvelopeError(parsed.error.issues[0]?.message);
  }
  const envelope = parsed.data;

  if (envelope.version > BACKUP_ENVELOPE_VERSION) {
    throw new UnsupportedBackupVersionError(envelope.version);
  }

  const key = await deriveKey(
    password,
    base64ToBytes(envelope.kdf.salt),
    envelope.kdf.iterations,
    envelope.kdf.hash,
  );

  try {
    const plaintext = await crypto.subtle.decrypt(
      // AAD option (deferred): if `encrypt` binds additionalData, supply the
      // identical bytes here — a mismatch fails auth exactly like a bad password.
      { name: "AES-GCM", iv: base64ToBytes(envelope.cipher.iv) },
      key,
      base64ToBytes(envelope.ciphertext),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    // AES-GCM throws a bare DOMException on auth-tag mismatch with no detail.
    // Collapse it to our one kind, intentional error.
    throw new WrongPasswordError();
  }
}
