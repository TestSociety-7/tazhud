import { createSeedData } from "./seed";
import type { StoreData } from "./types";

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
  save(data: StoreData): Promise<void>;
  reset(): Promise<StoreData>;
  /** Notifies when data changes elsewhere (another tab, another admin). */
  subscribe(onChange: (data: StoreData) => void): () => void;
}

const STORAGE_KEY = "tazhud:store:v1";

/** Fills in fields added in later versions so older saved data keeps working. */
export function normalizeStoreData(input: Partial<StoreData> | null | undefined): StoreData {
  const seed = createSeedData();
  if (!input || input.version !== 1) return seed;
  return {
    ...seed,
    ...input,
    settings: { ...seed.settings, ...input.settings },
    homepage: {
      ...seed.homepage,
      ...input.homepage,
      announcement: { ...seed.homepage.announcement, ...input.homepage?.announcement },
      hero: { ...seed.homepage.hero, ...input.homepage?.hero },
      promo: { ...seed.homepage.promo, ...input.homepage?.promo },
      story: { ...seed.homepage.story, ...input.homepage?.story },
      sections: input.homepage?.sections?.length ? input.homepage.sections : seed.homepage.sections,
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

export class StorageFullError extends Error {
  constructor() {
    super(
      "This browser's storage is full. Remove some uploaded images or use image URLs instead, then try again.",
    );
    this.name = "StorageFullError";
  }
}

/**
 * Local demo mode: data lives in this browser's localStorage. It is not shared
 * with other devices or visitors and must not be treated as secure.
 */
class LocalStorageRepository implements StoreRepository {
  readonly label = "Local demo mode";
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

let repo: StoreRepository | null = null;

export function getRepository(): StoreRepository {
  repo ??= new LocalStorageRepository();
  return repo;
}
