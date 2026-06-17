// scripts/check-no-dev-mock.mjs
//
// Post-build guard: fails the build loudly if the dev identity mock leaked into
// the production output. Pairs with the __DEV_IDENTITY_MOCK__ sentinel in
// app/components/dev/devIdentityMock.tsx, which should be dead-code-eliminated
// from any production build (gated by `import.meta.env.DEV`).
//
// Runs in the `postbuild` chain AFTER lift-subpath.mjs, so it scans the final
// shipped tree. Source maps are skipped — they can legitimately contain the
// original source string even when the executable code was eliminated.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "build/client";
const SENTINEL = "__DEV_IDENTITY_MOCK__";
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
  if (content.includes(SENTINEL)) leaked.push(file);
}

if (leaked.length > 0) {
  console.error(
    `[check-no-dev-mock] ⛔️ Dev identity mock leaked into the production build ❗️ \n` +
      `⚠️ Found "${SENTINEL}" in:\n` +
      leaked.map((f) => `  - ${f}`).join("\n") +
      `\nThe mock must be dead-code-eliminated from prod (it's gated by ` +
      `import.meta.env.DEV). Aborting the build.`,
  );
  process.exit(1);
}

console.log(`[check-no-dev-mock] ✔ no dev identity mock found in ${ROOT}/.`);
