// __DEV_DB_MOCK__ — sentinel. DEV-ONLY mock of the Sites `sites.db` Document Database.
// Must be dead-code-eliminated from prod: it's only reached via a dynamic import inside an
// `import.meta.env.DEV` gate (devIdentityMock.tsx), and `scripts/check-no-dev-mock.mjs`
// fails the build if this sentinel survives into `build/client`. Same safety story as the
// identity mock; in prod the real `/sdk/v1/sites.js` provides `window.sites.db`.
//
// There's no document DB locally, so this emulates one over a backing Store. The Store seam
// is intentionally ASYNC (Promise-returning) from day one — the localStorage adapter wraps
// sync work in promises, but keeping the contract async means the planned RxDB adapter (which
// is async/reactive) drops in behind this seam with no change above the line.

import type {
    OrderDir,
    SitesCollection,
    SitesDb,
    SitesDbError,
    SitesDoc,
    SitesQuery,
    WhereOp,
} from "~/lib/sitesDb";

// --- Backing-store seam ------------------------------------------------------

/**
 * The swappable backing store. localStorage adapter today; RxDB adapter later — same
 * interface. The mock engine above never touches the store's medium directly.
 */
export interface CollectionStore {
    readAll(collection: string): Promise<SitesDoc[]>;
    writeAll(collection: string, docs: SitesDoc[]): Promise<void>;
    /** Names of collections that currently exist (may include empty ones; the facade filters). */
    listCollections(): Promise<string[]>;
}

// Distinct localStorage channel — must never collide with the app's own state (the
// AnswerStateProvider uses the bare "answers" key). The later "clear my data" CTA should
// treat this prefix as separately clearable (see TASKS Track 2 note).
const NS = "sites-db-mock:";

class LocalStorageStore implements CollectionStore {
    async readAll(collection: string): Promise<SitesDoc[]> {
        const raw = localStorage.getItem(NS + collection);
        return raw ? (JSON.parse(raw) as SitesDoc[]) : [];
    }

    async writeAll(collection: string, docs: SitesDoc[]): Promise<void> {
        localStorage.setItem(NS + collection, JSON.stringify(docs));
    }

    async listCollections(): Promise<string[]> {
        const names: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(NS)) names.push(key.slice(NS.length));
        }
        return names;
    }
}

// --- Spec helpers ------------------------------------------------------------

const COLLECTION_NAME = /^[a-z0-9][a-z0-9_-]{0,62}$/;
const VALID_OPS: ReadonlySet<WhereOp> = new Set(["eq", "ne", "lt", "lte", "gt", "gte"]);
const RESERVED_KEYS = ["id", "created_at", "updated_at", "author_email"] as const;
const DEFAULT_LIMIT = 50;

/** Build an error object matching the SDK's reject shape (`error` machine code + extras). */
function dbError(code: SitesDbError["error"], detail?: string): SitesDbError {
    const err = new Error(`sites.db: ${code}${detail ? ` — ${detail}` : ""}`) as SitesDbError;
    err._v = 1;
    err.error = code;
    if (detail) err.detail = detail;
    return err;
}

function stripReserved(obj: Record<string, unknown>): Record<string, unknown> {
    const out = { ...obj };
    for (const key of RESERVED_KEYS) delete out[key];
    return out;
}

function matches(actual: unknown, op: WhereOp, expected: unknown): boolean {
    switch (op) {
        case "eq":
            return actual === expected;
        case "ne":
            return actual !== expected;
        // Relational ops lean on JS comparison; ISO date strings sort/compare correctly.
        case "lt":
            return (actual as never) < (expected as never);
        case "lte":
            return (actual as never) <= (expected as never);
        case "gt":
            return (actual as never) > (expected as never);
        case "gte":
            return (actual as never) >= (expected as never);
    }
}

function compareForSort(a: unknown, b: unknown): number {
    if (a === b) return 0;
    if (a === undefined || a === null) return -1;
    if (b === undefined || b === null) return 1;
    return (a as never) < (b as never) ? -1 : 1;
}

// --- Collection handle (query builder + CRUD) --------------------------------

type QueryState = {
    wheres: { field: string; op: WhereOp; value: unknown }[];
    order?: { field: string; dir: OrderDir };
    limit: number;
};

function createCollection(name: string, store: CollectionStore, authorEmail: string): SitesCollection {
    if (!COLLECTION_NAME.test(name)) {
        // Spec: collection(name) throws *synchronously* on an invalid name.
        throw dbError("validation_failed", `invalid collection name "${name}"`);
    }

    const runList = async (state: QueryState): Promise<SitesDoc[]> => {
        let docs = await store.readAll(name);
        for (const { field, op, value } of state.wheres) {
            docs = docs.filter((doc) => matches(doc[field], op, value));
        }
        const field = state.order?.field ?? "created_at";
        const dir = state.order?.dir ?? "desc";
        docs = [...docs].sort((a, b) => compareForSort(a[field], b[field]) * (dir === "desc" ? -1 : 1));
        return docs.slice(0, state.limit);
    };

    // Immutable builder: each call returns a fresh query so the collection handle is reusable.
    const makeQuery = (state: QueryState): SitesQuery => ({
        where(field, op, value) {
            if (!VALID_OPS.has(op)) throw dbError("validation_failed", `unknown operator "${op}"`);
            if (value === null) throw dbError("validation_failed", "where value cannot be null in v1");
            return makeQuery({ ...state, wheres: [...state.wheres, { field, op, value }] });
        },
        orderBy(field, dir = "desc") {
            return makeQuery({ ...state, order: { field, dir } });
        },
        limit(n) {
            return makeQuery({ ...state, limit: Math.max(1, Math.min(200, Math.trunc(n))) });
        },
        list() {
            return runList(state);
        },
    });

    const base: QueryState = { wheres: [], limit: DEFAULT_LIMIT };

    return {
        ...makeQuery(base),

        async create(doc) {
            const docs = await store.readAll(name);
            const now = new Date().toISOString();
            const created: SitesDoc = {
                ...stripReserved(doc),
                id: crypto.randomUUID(),
                created_at: now,
                updated_at: now,
                author_email: authorEmail,
            };
            await store.writeAll(name, [...docs, created]);
            return created;
        },

        async get(id) {
            const docs = await store.readAll(name);
            return docs.find((doc) => doc.id === id) ?? null;
        },

        async update(id, patch) {
            const docs = await store.readAll(name);
            const index = docs.findIndex((doc) => doc.id === id);
            if (index === -1) throw dbError("not_found", `document "${id}" not found`);

            const merged: SitesDoc = { ...docs[index] };
            for (const [key, value] of Object.entries(stripReserved(patch))) {
                if (value === null) delete merged[key]; // explicit null removes the key
                else merged[key] = value; // nested objects replace (no deep merge in v1)
            }
            merged.updated_at = new Date().toISOString();

            docs[index] = merged;
            await store.writeAll(name, docs);
            return merged;
        },

        async delete(id) {
            const docs = await store.readAll(name);
            const next = docs.filter((doc) => doc.id !== id);
            if (next.length === docs.length) throw dbError("not_found", `document "${id}" not found`);
            await store.writeAll(name, next);
            return true;
        },

        async deleteAll() {
            // Real API is owner-only + requires typing the name to confirm in the Data Browser;
            // not modelled locally (single-user mock — the caller is always the owner).
            await store.writeAll(name, []);
        },
    };
}

// --- Public factory ----------------------------------------------------------

/**
 * Build a `window.sites.db` mock. `authorEmail` stamps created docs (the signed-in mock
 * viewer's email, or "" for the guest/anonymous mode). The store defaults to localStorage;
 * pass a different `CollectionStore` (e.g. the future RxDB adapter) to swap the backing medium.
 */
export function createSitesDbMock(
    { authorEmail }: { authorEmail: string },
    store: CollectionStore = new LocalStorageStore(),
): SitesDb {
    return {
        collection(name) {
            return createCollection(name, store, authorEmail);
        },
        async listCollections() {
            const names = await store.listCollections();
            const out: { name: string; doc_count: number }[] = [];
            for (const name of names) {
                const count = (await store.readAll(name)).length;
                if (count > 0) out.push({ name, doc_count: count });
            }
            return out;
        },
    };
}
