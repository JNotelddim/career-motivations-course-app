import type { SitesDb } from "~/lib/sitesDb";

// `window.sites.db` is not necessarily present the moment auth resolves: the dev
// mock attaches it via an async dynamic import (kept out of the prod bundle),
// and even the real SDK exposes `db` as optional. Reading it once in a mount
// effect therefore races — after a hard reload (e.g. post-restore) the read can
// land before `db` is attached, leaving the UI stuck on a stale "no backup"
// state. So we poll, mirroring AuthProvider's waitForSitesSdk.

const READY_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 50;

/** Resolve `window.sites.db` once it's attached, or `null` on timeout. */
export async function waitForSitesDb(): Promise<SitesDb | null> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const db = typeof window !== "undefined" ? window.sites?.db : undefined;
    if (db) return db;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return null;
}
