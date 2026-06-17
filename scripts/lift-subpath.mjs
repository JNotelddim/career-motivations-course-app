// scripts/lift-subpath.mjs
//
// ⚠️ INTERIM WORKAROUND — delete this script + the package.json "postbuild" hook
// once EITHER:
//   • Metalab Sites supports SPA history fallback (preferred — the real fix), OR
//   • React Router fixes basename+prerender output nesting
//     (https://github.com/remix-run/react-router/issues/14587).
//
// Why this exists:
//   With `ssr: false` + `basename` + `prerender`, React Router writes the
//   prerendered output NESTED under the basename path, i.e.
//     build/client/jared/career-motivations-worksheet/index.html
//   But Sites already serves our uploaded folder FROM that same subpath, so the
//   prefix gets applied twice and the deploy breaks. This lifts the nested
//   contents back up to build/client/ so the tree matches what Sites expects.
//   Vite asset URLs already carry the subpath prefix and assets stay at
//   build/client/assets/, so after lifting everything resolves correctly.
//
// NOTE: in SPA mode the prerendered files are all the same shell (no per-route
// markup) — the only benefit is a file existing at each path so deep links /
// hard refresh don't 404. VERIFY on deployed Sites that those shells actually
// hydrate + route; if they come out non-functional (see issue #13615), abandon
// this interim and just wait on the Sites fallback fix.

import { readdir, rename, rm, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "build/client";
// Keep in sync with `basename` in react-router.config.ts.
const SUBPATH = "jared/career-motivations-worksheet";
const nested = join(ROOT, SUBPATH);

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

// Move entries from `src` into `dest`, recursing/merging into existing dirs so
// we never clobber sibling output (e.g. assets/) that already sits at root.
async function mergeMove(src, dest) {
  await mkdir(dest, { recursive: true });
  for (const entry of await readdir(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dest, entry.name);
    if (entry.isDirectory() && (await exists(to))) {
      await mergeMove(from, to);
    } else {
      await rename(from, to);
    }
  }
}

if (!(await exists(nested))) {
  // No nested dir — RR's behavior changed (bug fixed?) or prerender is off.
  // No-op rather than fail, so a future RR fix doesn't break the build.
  console.log(`[lift-subpath] no nested dir at ${nested} — nothing to lift.`);
  process.exit(0);
}

await mergeMove(nested, ROOT);
// Remove the now-empty leading subpath segment (e.g. build/client/jared).
await rm(join(ROOT, SUBPATH.split("/")[0]), { recursive: true, force: true });
console.log(`[lift-subpath] lifted ${nested}/* → ${ROOT}/`);
