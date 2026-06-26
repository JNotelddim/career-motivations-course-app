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
    // Node env is enough for the crypto core (Web Crypto, btoa/atob, TextEncoder
    // are all Node globals). Switch to "jsdom" if/when we test DOM-touching code.
    environment: "node",
    include: ["app/**/*.test.ts"],
  },
});
