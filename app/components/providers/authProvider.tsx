import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "~/consts/routes";

/**
 * Raw shape returned by the Sites v1 Platform SDK (`/sdk/v1/sites.js`).
 * Wire shape is locked to `_v: 1` for 24+ months; field names are snake_case.
 */
type SitesViewer = {
  _v: number;
  email: string;
  display_name: string;
  tenant: string;
};

declare global {
  interface Window {
    sites?: {
      /**
       * Resolves to the viewer, or `null` for guests / `_v` mismatch / network
       * error. Per the docs it never throws — `null` is the only failure mode.
       */
      user: (opts?: { fresh?: boolean }) => Promise<SitesViewer | null>;
    };
  }
}

/** App-facing viewer model, mapped from the SDK's snake_case wire shape. */
export type Viewer = {
  name: string;
  email: string;
  tenant: string;
};

/**
 * Auth state machine, discriminated on `status` so illegal combinations
 * (e.g. "authenticated" with no user) are unrepresentable.
 */
export type AuthState =
  | { status: "uninitialized" }
  | { status: "loading" }
  | { status: "authenticated"; user: Viewer }
  | { status: "unauthenticated" }
  | { status: "error"; reason: "sdk-unavailable" | "lookup-failed" };

const AuthContext = createContext<AuthState | undefined>(undefined);

/** Max wait for the async SDK script to attach `window.sites` before giving up. */
const SDK_READY_TIMEOUT_MS = 5000;
const SDK_POLL_INTERVAL_MS = 50;

/** Poll for the SDK loader to define `window.sites`. Resolves `null` on timeout. */
async function waitForSitesSdk(): Promise<NonNullable<Window["sites"]> | null> {
  const deadline = Date.now() + SDK_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (typeof window !== "undefined" && window.sites) return window.sites;
    await new Promise((resolve) => setTimeout(resolve, SDK_POLL_INTERVAL_MS));
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "uninitialized" });
  const navigate = useNavigate();

  // Resolve the viewer once on mount. Client-only: effects don't run during
  // the prerender pass, so `window` access here is safe.
  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      const sdk = await waitForSitesSdk();
      if (cancelled) return;
      if (!sdk) {
        setState({ status: "error", reason: "sdk-unavailable" });
        return;
      }
      try {
        const viewer = await sdk.user();
        if (cancelled) return;
        if (viewer) {
          setState({
            status: "authenticated",
            user: {
              name: viewer.display_name,
              email: viewer.email,
              tenant: viewer.tenant,
            },
          });
        } else {
          // Loaded but no identity: guest / _v mismatch / network error.
          setState({ status: "unauthenticated" });
        }
      } catch {
        // Docs say user() never throws; guard defensively regardless.
        if (!cancelled) setState({ status: "error", reason: "lookup-failed" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Safety net: anyone we couldn't authenticate goes to the explainer page.
  // The site is Okta-gated, so in practice this should never fire.
  useEffect(() => {
    if (state.status === "unauthenticated" || state.status === "error") {
      navigate(ROUTES.unauthenticated, { replace: true });
    }
  }, [state.status, navigate]);

  const isResolving =
    state.status === "uninitialized" || state.status === "loading";

  return (
    <AuthContext.Provider value={state}>
      {isResolving ? <AuthLoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

/** Read the current auth state. Throws if used outside an <AuthProvider>. */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth() must be used within an <AuthProvider>.");
  }
  return ctx;
}

// Placeholder gate UI — yours to style (Realm 4).
function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="text-md sm:text-lg">Signing you in…</p>
    </main>
  );
}
