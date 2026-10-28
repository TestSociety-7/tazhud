import { createSeedData } from "./seed";
import type { OrderInquiry, StoreData, Subscriber } from "./types";

/**
 * The storage boundary for everything the admin can edit.
 *
 * The UI only talks to this interface. To move to a shared database, implement
 * it with fetch calls to your API (or a Supabase / Postgres client) and return
 * that implementation from `getRepository()`. No UI code needs to change.
 */
export interface StoreRepository {
  /** Human-readable label shown in the admin, e.g. "Local demo mode". */
  readonly label: string;
  /** True when data is only stored in the current browser. */
  readonly isLocalOnly: boolean;
  load(): Promise<StoreData>;
  /** Persists `next`. `previous` lets remote stores send only what changed. */
  save(next: StoreData, previous: StoreData): Promise<void>;
  /** Restores the starter catalogue. Shared storage keeps real orders. */
  reset(current: StoreData): Promise<StoreData>;
  /** Notifies when data changes elsewhere (another tab, another admin). */
  subscribe(onChange: (data: StoreData) => void): () => void;
}

const STORAGE_KEY = "tazhud:store:v3";

/** Homepage sections the storefront still renders. */
const HOME_SECTIONS = new Set(["categories", "newArrivals", "promo"]);

/** Fills in fields added in later versions so older saved data keeps working. */
export function normalizeStoreData(input: Partial<StoreData> | null | undefined): StoreData {
  const seed = createSeedData();
  if (!input || input.version !== 1) return seed;
  return {
    ...seed,
    ...input,
    // The store sells in shekel only; older saves may still say USD.
    settings: { ...seed.settings, ...input.settings, currency: "ILS", locale: "ar-u-nu-latn" },
    homepage: {
      ...seed.homepage,
      ...input.homepage,
      announcement: { ...seed.homepage.announcement, ...input.homepage?.announcement },
      hero: { ...seed.homepage.hero, ...input.homepage?.hero },
      promo: { ...seed.homepage.promo, ...input.homepage?.promo },
      story: { ...seed.homepage.story, ...input.homepage?.story },
      sections: (input.homepage?.sections?.length ? input.homepage.sections : seed.homepage.sections).filter((x) => HOME_SECTIONS.has(x.key)),
    },
    categories: input.categories ?? seed.categories,
    products: input.products ?? seed.products,
    bundles: input.bundles ?? seed.bundles,
    coupons: input.coupons ?? seed.coupons,
    orders: input.orders ?? seed.orders,
    orderSequence: input.orderSequence ?? seed.orderSequence,
    subscribers: input.subscribers ?? seed.subscribers,
  };
}

/** Everything customers can see. Orders and subscribers are kept separately. */
export type Catalog = Omit<StoreData, "orders" | "subscribers" | "orderSequence">;

export function splitStoreData(data: StoreData): {
  catalog: Catalog;
  orders: OrderInquiry[];
  subscribers: Subscriber[];
} {
  const { orders, subscribers, orderSequence: _seq, ...catalog } = data;
  void _seq;
  return { catalog, orders, subscribers };
}

export function catalogToStoreData(catalog: Catalog | null): StoreData {
  return normalizeStoreData({ ...(catalog ?? splitStoreData(createSeedData()).catalog), orders: [], subscribers: [], orderSequence: 0 });
}

export class StorageFullError extends Error {
  constructor() {
    super("مساحة التخزين في هذا المتصفح ممتلئة. احذف بعض الصور المرفوعة أو استخدم روابط صور، ثم حاول مجددًا.");
    this.name = "StorageFullError";
  }
}

/**
 * Local demo mode: data lives in this browser's localStorage. It is not shared
 * with other devices or visitors and must not be treated as secure.
 */
class LocalStorageRepository implements StoreRepository {
  readonly label = "الوضع التجريبي المحلي";
  readonly isLocalOnly = true;

  async load() {
    if (typeof window === "undefined") return createSeedData();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return normalizeStoreData(raw ? JSON.parse(raw) : null);
    } catch {
      return createSeedData();
    }
  }

  async save(data: StoreData) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      if (err instanceof DOMException && (err.name === "QuotaExceededError" || err.code === 22)) {
        throw new StorageFullError();
      }
      throw err;
    }
  }

  async reset() {
    const seed = createSeedData();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable; seed is still returned */
    }
    return seed;
  }

  subscribe(onChange: (data: StoreData) => void) {
    if (typeof window === "undefined") return () => {};
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        onChange(normalizeStoreData(e.newValue ? JSON.parse(e.newValue) : null));
      } catch {
        /* ignore malformed writes */
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}

async function send(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = "تعذّر الحفظ. تحقق من الاتصال وحاول مجددًا.";
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* keep default message */
    }
    if (res.status === 401) message = "انتهت جلسة الدخول. سجّل الدخول مجددًا ثم أعد المحاولة.";
    throw new Error(message);
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Shared mode: data lives on the server (Vercel Blob). Customers get the
 * catalogue rendered by the server; the admin loads everything fresh through
 * the protected admin API. Each save sends only the parts that changed.
 */
class SharedRepository implements StoreRepository {
  readonly label = "التخزين المشترك (Vercel Blob)";
  readonly isLocalOnly = false;

  constructor(
    private readonly initial: StoreData,
    private readonly scope: "store" | "admin",
  ) {}

  async load() {
    if (this.scope !== "admin") return this.initial;
    const res = await fetch("/api/admin/data", { cache: "no-store" });
    if (!res.ok) throw new Error("تعذّر تحميل بيانات المتجر.");
    const json = (await res.json()) as { catalog: Catalog | null; orders: OrderInquiry[]; subscribers: Subscriber[] };
    return { ...catalogToStoreData(json.catalog), orders: json.orders, subscribers: json.subscribers };
  }

  async save(next: StoreData, previous: StoreData) {
    const a = splitStoreData(next);
    const b = splitStoreData(previous);
    const tasks: Promise<void>[] = [];
    if (!same(a.catalog, b.catalog)) tasks.push(send("PUT", "/api/admin/catalog", a.catalog));

    const before = new Map(b.orders.map((o) => [o.id, o]));
    for (const order of a.orders) {
      const old = before.get(order.id);
      if (!old) tasks.push(send("POST", "/api/orders", order));
      else if (!same(old, order)) tasks.push(send("PUT", `/api/admin/orders/${encodeURIComponent(order.id)}`, order));
    }
    const kept = new Set(a.orders.map((o) => o.id));
    for (const order of b.orders) {
      if (!kept.has(order.id)) tasks.push(send("DELETE", `/api/admin/orders/${encodeURIComponent(order.id)}`));
    }

    await Promise.all(tasks);
  }

  async reset(current: StoreData) {
    const seed = createSeedData();
    const next = { ...seed, orders: current.orders, subscribers: current.subscribers };
    await send("PUT", "/api/admin/catalog", splitStoreData(next).catalog);
    return next;
  }

  subscribe() {
    return () => {};
  }
}

export interface RepositoryOptions {
  shared: boolean;
  scope: "store" | "admin";
  initial: StoreData;
}

export function createRepository({ shared, scope, initial }: RepositoryOptions): StoreRepository {
  return shared ? new SharedRepository(initial, scope) : new LocalStorageRepository();
}
