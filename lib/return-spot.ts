/**
 * Remembers where a shopper was (page, filters and scroll position) when she opened
 * a product, so "back" and "continue shopping" take her to the same spot.
 * Lives in sessionStorage: per tab, gone when the tab closes.
 */
const SPOT = "tazhud:return-spot";
const RESTORE = "tazhud:restore-spot";

export interface Spot {
  /** The list page, with its query string. */
  href: string;
  y: number;
  /** The product page she went to from there. */
  to: string;
}

function storage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function rememberSpot(to: string) {
  if (location.pathname.startsWith("/product/")) return;
  storage()?.setItem(SPOT, JSON.stringify({ href: location.pathname + location.search, y: Math.round(scrollY), to } satisfies Spot));
}

export function readSpot(): Spot | null {
  try {
    const raw = storage()?.getItem(SPOT);
    return raw ? (JSON.parse(raw) as Spot) : null;
  } catch {
    return null;
  }
}

export function requestRestore() {
  storage()?.setItem(RESTORE, "1");
}

export function takeRestoreRequest() {
  const s = storage();
  const asked = s?.getItem(RESTORE) === "1";
  s?.removeItem(RESTORE);
  return asked;
}

/** Saves a small piece of list state (like the chosen tab) for this tab only. */
export function saveListState(key: string, value: unknown) {
  storage()?.setItem(`tazhud:list:${key}`, JSON.stringify(value));
}

export function readListState<T>(key: string): T | null {
  try {
    const raw = storage()?.getItem(`tazhud:list:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
