import { useEffect, useState } from "react";

/**
 * DEV-ONLY mock of the Sites Platform SDK identity call.
 *
 * Real Okta identity can't resolve on localhost (the SDK script 404s there and
 * the session cookie is origin-scoped to the deployed domain), so this
 * fabricates a `window.sites` for local development. It's fabricated data only
 * — no real credential — and the server still gates all real data, so even a
 * leak would unlock UI, not data.
 *
 * SAFETY: the injection runs inside an effect whose body is gated by
 * `import.meta.env.DEV`. A production build replaces that with the literal
 * `false`, so the whole block — including the `__DEV_IDENTITY_MOCK__` sentinel
 * — is dead-code-eliminated. The render site in root.tsx is also dev-gated, and
 * `scripts/check-no-dev-mock.mjs` fails the build if the sentinel ever survives
 * into `build/client`.
 *
 * MODE is chosen via `VITE_DEV_IDENTITY` (default "authenticated"). It's inlined
 * at dev-server start, so changing it requires restarting the dev server.
 */

type DevIdentityMode = "authenticated" | "guest" | "sdk-unavailable";

// Raw wire shape the real SDK resolves from /api/v1/me (snake_case, incl. _v).
type SitesViewer = {
  _v: number;
  email: string;
  display_name: string;
  tenant: string;
};

const MOCK_VIEWER: SitesViewer = {
  _v: 1,
  email: "jared-test@metalab.com",
  display_name: "Jared Test",
  tenant: "metalab",
};

export function DevIdentityMock() {
  const [mode, setMode] = useState<DevIdentityMode | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      // __DEV_IDENTITY_MOCK__ — sentinel. Must be DCE'd from prod; the
      // post-build guard fails the build if it survives into build/client.
      const selected: DevIdentityMode =
        import.meta.env.VITE_DEV_IDENTITY ?? "authenticated";

      // "sdk-unavailable": deliberately attach nothing, so the provider's poll
      // times out and exercises the real `error` (sdk-unavailable) branch.
      if (selected !== "sdk-unavailable" && !window.sites) {
        window.sites = {
          // Mirror the real contract: returns a Promise, accepts `{ fresh }`,
          // never throws, resolves the raw viewer (authenticated) or null (guest).
          user: (_opts?: { fresh?: boolean }) =>
            Promise.resolve(selected === "authenticated" ? MOCK_VIEWER : null),
        };

        // Attach the document-DB mock via a DEV-gated dynamic import so it (and the
        // future RxDB adapter behind its Store seam) is never pulled into the prod
        // bundle. `author_email` mirrors the viewer: the mock email when authenticated,
        // "" (anonymous) for guest, matching the public-write contract. The brief async
        // gap before `db` attaches is harmless — only user-initiated reads/writes use it.
        void import("./sitesDbMock").then(({ createSitesDbMock }) => {
          if (window.sites && !window.sites.db) {
            window.sites.db = createSitesDbMock({
              authorEmail: selected === "authenticated" ? MOCK_VIEWER.email : "",
            });
          }
        });
      }

      setMode(selected);
    }
  }, []);

  if (!import.meta.env.DEV || mode === null) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: 9999,
        background: "#7c2d12",
        color: "#fff",
        font: "600 12px/1.4 system-ui, sans-serif",
        textAlign: "center",
        padding: "4px 8px",
      }}
    >
      ⚠️ MOCK IDENTITY ACTIVE — VITE_DEV_IDENTITY=<code>{mode}</code> (dev only)
    </div>
  );
}
