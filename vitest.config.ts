import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Standalone test config — deliberately does NOT load the React Router plugin
// from vite.config.ts (it's irrelevant to unit tests and only adds surface to
// break). We just re-declare the one thing tests need: the `~` path alias.
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
  test: {
    // Node env by default — enough for the pure lib cores (Web Crypto, btoa/atob,
    // TextEncoder are all Node globals). Component tests opt into jsdom per-file
    // with a `// @vitest-environment jsdom` docblock.
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
