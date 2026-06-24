// scripts/check-no-dev-mock.mjs
//
// Post-build guard: fails the build loudly if any dev mock leaked into the
// production output. Pairs with the sentinels in app/components/dev/ — the
// identity mock (devIdentityMock.tsx) and the sites.db mock (sitesDbMock.ts) —
// each of which should be dead-code-eliminated from any production build (gated
// by `import.meta.env.DEV`; the db mock additionally only reachable via a
// DEV-gated dynamic import).
//
// Runs in the `postbuild` chain AFTER lift-subpath.mjs, so it scans the final
// shipped tree. Source maps are skipped — they can legitimately contain the
// original source string even when the executable code was eliminated.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "build/client";
const SENTINELS = ["__DEV_IDENTITY_MOCK__", "__DEV_DB_MOCK__"];
const SCANNED = /\.(js|mjs|cjs|html)$/;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const leaked = [];
for await (const file of walk(ROOT)) {
  if (!SCANNED.test(file)) continue;
  const content = await readFile(file, "utf8");
  for (const sentinel of SENTINELS) {
    if (content.includes(sentinel)) leaked.push({ file, sentinel });
  }
}

if (leaked.length > 0) {
  console.error(
    `[check-no-dev-mock] ⛔️ A dev mock leaked into the production build ❗️ \n` +
      leaked.map(({ file, sentinel }) => `  - "${sentinel}" in ${file}`).join("\n") +
      `\nDev mocks must be dead-code-eliminated from prod (gated by ` +
      `import.meta.env.DEV). Aborting the build.`,
  );
  process.exit(1);
}

console.log(`[check-no-dev-mock] ✔ no dev mocks (${SENTINELS.join(", ")}) found in ${ROOT}/.`);
