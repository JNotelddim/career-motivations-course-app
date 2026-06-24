// Type surface for the Sites Platform v1 **Document Database** SDK (`window.sites.db`).
// This is the *real* contract (provided by `/sdk/v1/sites.js` in prod); the dev mock in
// `app/components/dev/sitesDbMock.ts` implements it locally. Kept in app/lib (not the dev
// folder) so prod code — the `Window` augmentation in authProvider — can reference it
// without importing dev-only modules.
//
// Source: Sites docs → Document Database, Command Reference (v1).

/** A stored document. Reserved keys are server-managed; callers can't set them. */
export type SitesDoc = Record<string, unknown> & {
    id: string;
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
    author_email: string; // "" for anonymous (public-write sites)
};

/** The only filter operators v1 supports. */
export type WhereOp = "eq" | "ne" | "lt" | "lte" | "gt" | "gte";

export type OrderDir = "asc" | "desc";

/** A chainable, read-only query. `where`/`orderBy`/`limit` return a new query; `list` is terminal. */
export type SitesQuery = {
    /** AND-ed with any prior `where`. `value` of `null` throws synchronously (out of spec in v1). */
    where(field: string, op: WhereOp, value: unknown): SitesQuery;
    /** Defaults to `created_at` `desc` server-side when omitted. */
    orderBy(field: string, dir?: OrderDir): SitesQuery;
    /** Clamped to 1..200; default 50. */
    limit(n: number): SitesQuery;
    /** Terminal — fires the request and returns the matching documents. */
    list(): Promise<SitesDoc[]>;
};

/** A collection handle: the full query surface plus document CRUD. */
export type SitesCollection = SitesQuery & {
    /** Reserved keys (`id`/`created_at`/`updated_at`/`author_email`) are stripped before storing. */
    create(doc: Record<string, unknown>): Promise<SitesDoc>;
    get(id: string): Promise<SitesDoc | null>;
    /** Shallow top-level merge (Firestore-style). Explicit `null` removes a key; nested objects replace. */
    update(id: string, patch: Record<string, unknown>): Promise<SitesDoc>;
    /** Resolves `true` on success. */
    delete(id: string): Promise<boolean>;
    /** Owner-only; clears every document in the collection. */
    deleteAll(): Promise<void>;
};

export type SitesDb = {
    /** Name must match `^[a-z0-9][a-z0-9_-]{0,62}$`; throws synchronously otherwise. */
    collection(name: string): SitesCollection;
    /** Collections with at least one document. */
    listCollections(): Promise<{ name: string; doc_count: number }[]>;
};

/**
 * The shape the SDK rejects with. `error` is the machine code; `detail`/`retry_after`
 * are present on `quota_exceeded`/`validation_failed` and `rate_limited` respectively.
 */
export type SitesDbError = Error & {
    _v: 1;
    error:
        | "unauthenticated"
        | "scope_expired"
        | "forbidden"
        | "not_found"
        | "validation_failed"
        | "quota_exceeded"
        | "rate_limited"
        | "csrf_invalid"
        | "bad_request";
    detail?: string;
    retry_after?: number;
};
