import { describe, expect, it } from "vitest";

import {
  BACKUP_ENVELOPE_VERSION,
  backupEnvelopeSchema,
  decrypt,
  encrypt,
  MalformedEnvelopeError,
  UnsupportedBackupVersionError,
  WrongPasswordError,
} from "~/lib/backup/crypto";

const PASSWORD = "correct horse battery staple";

// A realistic payload: the JSON-stringified answers blob, incl. unicode and the
// nested rowList shape, so we exercise more than ASCII.
const PLAINTEXT = JSON.stringify({
  "m01-question": { value: "I value autonomy 🚀 and té", kind: "shortText", isComplete: true },
  "m03-decisions": { value: [{ id: "abc", values: { year: "2020" } }], kind: "rowList" },
});

/** Length in bytes of a base64 string, for asserting salt/IV sizes. */
const byteLength = (b64: string) => atob(b64).length;

describe("encrypt", () => {
  it("produces a self-describing envelope matching the locked spec", async () => {
    const envelope = await encrypt(PLAINTEXT, PASSWORD);

    expect(envelope.version).toBe(BACKUP_ENVELOPE_VERSION);
    expect(envelope.kdf.algorithm).toBe("PBKDF2");
    expect(envelope.kdf.hash).toBe("SHA-256");
    expect(envelope.kdf.iterations).toBe(600_000);
    expect(envelope.cipher.algorithm).toBe("AES-256-GCM");
    expect(byteLength(envelope.kdf.salt)).toBe(16);
    expect(byteLength(envelope.cipher.iv)).toBe(12);
    expect(backupEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });

  it("uses a fresh salt and IV every call (no reuse)", async () => {
    const a = await encrypt(PLAINTEXT, PASSWORD);
    const b = await encrypt(PLAINTEXT, PASSWORD);

    expect(a.kdf.salt).not.toBe(b.kdf.salt);
    expect(a.cipher.iv).not.toBe(b.cipher.iv);
    // Identical plaintext + password must still yield different ciphertext.
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });
});

describe("decrypt", () => {
  it("round-trips back to the original plaintext", async () => {
    const envelope = await encrypt(PLAINTEXT, PASSWORD);
    expect(await decrypt(envelope, PASSWORD)).toBe(PLAINTEXT);
  });

  it("round-trips an empty string", async () => {
    const envelope = await encrypt("", PASSWORD);
    expect(await decrypt(envelope, PASSWORD)).toBe("");
  });

  it("rejects a wrong password via the GCM auth tag", async () => {
    const envelope = await encrypt(PLAINTEXT, PASSWORD);
    await expect(decrypt(envelope, "not the password")).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("rejects tampered ciphertext", async () => {
    const envelope = await encrypt(PLAINTEXT, PASSWORD);
    const tampered = { ...envelope, ciphertext: btoa("not the real ciphertext bytes") };
    await expect(decrypt(tampered, PASSWORD)).rejects.toBeInstanceOf(WrongPasswordError);
  });

  it("rejects a structurally malformed input before attempting decryption", async () => {
    await expect(decrypt({ not: "an envelope" }, PASSWORD)).rejects.toBeInstanceOf(
      MalformedEnvelopeError,
    );
  });

  it("rejects an envelope from a newer format version", async () => {
    const envelope = await encrypt(PLAINTEXT, PASSWORD);
    await expect(decrypt({ ...envelope, version: 999 }, PASSWORD)).rejects.toBeInstanceOf(
      UnsupportedBackupVersionError,
    );
  });
});
