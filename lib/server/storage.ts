import { createHash } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { normalizeStoreData, splitStoreData, type Catalog } from "@/lib/repository";
import type { OrderInquiry, ReturnRequest, Subscriber } from "@/lib/types";

/**
 * Shared storage on Vercel Blob.
 *
 * - The public catalogue (products, settings, homepage…) lives in one JSON
 *   file. Customers read it through a cached server function.
 * - Orders and subscribers are one file each under a folder whose name is
 *   derived from a server secret, so their URLs cannot be guessed. Only the
 *   admin API lists and reads them.
 *
 * Without a Blob token the site falls back to local demo mode.
 */

export const CATALOG_TAG = "catalog";
const CATALOG_PATH = "store/catalog.json";

/**
 * The Blob read-write token. Vercel names it BLOB_READ_WRITE_TOKEN by default, but
 * a store connected with a custom prefix gets e.g. TAZHUD_READ_WRITE_TOKEN, so any
 * variable holding a Blob token is accepted.
 */
export function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("READ_WRITE_TOKEN") && value?.startsWith("vercel_blob_rw_")) return value;
  }
  return undefined;
}

/**
 * Shared storage is on when there is a Blob token, or when the store is connected
 * the newer way (BLOB_STORE_ID), where Vercel signs requests itself (OIDC).
 */
export function hasSharedStorage() {
  return Boolean(blobToken() || process.env.BLOB_STORE_ID);
}

/** Server-only seed for names and keys that must stay stable and unguessable. */
export function serverSeed() {
  return process.env.ADMIN_SESSION_SECRET || blobToken() || process.env.BLOB_STORE_ID || "tazhud";
}

function privateFolder() {
  return `private-${createHash("sha256").update(`tazhud-private:${serverSeed()}`).digest("hex").slice(0, 32)}`;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const res = await get(pathname, { access: "public", useCache: false, token: blobToken() });
  if (!res || res.statusCode !== 200) return null;
  return (await new Response(res.stream).json()) as T;
}

async function writeJson(pathname: string, value: unknown) {
  await put(pathname, JSON.stringify(value), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
    token: blobToken(),
  });
}

/** The saved catalogue, or null when nothing has been saved yet. */
export async function readCatalog(): Promise<Catalog | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 });
  if (!hasSharedStorage()) return null;
  try {
    const saved = await readJson<Partial<Catalog>>(CATALOG_PATH);
    return saved ? splitStoreData(normalizeStoreData({ ...saved, version: 1 })).catalog : null;
  } catch (err) {
    console.error("Could not read the catalogue from Vercel Blob", err);
    return null;
  }
}

export async function writeCatalog(catalog: Catalog) {
  await writeJson(CATALOG_PATH, catalog);
  revalidateTag(CATALOG_TAG, { expire: 0 });
}

const orderPath = (id: string) => `${privateFolder()}/orders/${id}.json`;
const subscriberPath = (email: string) =>
  `${privateFolder()}/subscribers/${createHash("sha256").update(email).digest("hex").slice(0, 24)}.json`;

async function readFolder<T>(folder: string, limit: number): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `${privateFolder()}/${folder}/`, cursor, limit: 1000, token: blobToken() });
    const items = await Promise.all(page.blobs.map((b) => readJson<T>(b.pathname).catch(() => null)));
    for (const it of items) if (it) out.push(it);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && out.length < limit);
  return out;
}

export async function readOrders(): Promise<OrderInquiry[]> {
  const orders = await readFolder<OrderInquiry>("orders", 20_000);
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

let lookupCache: { at: number; orders: Promise<OrderInquiry[]> } | null = null;

/**
 * Orders for customers' own lookups (status, returns). Kept for 20 seconds, so
 * many lookups in a row can't make the server read every order again and again.
 */
export function readOrdersForLookup() {
  if (!lookupCache || Date.now() - lookupCache.at > 20_000) {
    const orders = readOrders();
    lookupCache = { at: Date.now(), orders };
    orders.catch(() => (lookupCache = null));
  }
  return lookupCache.orders;
}

export async function readSubscribers(): Promise<Subscriber[]> {
  const subs = await readFolder<Subscriber>("subscribers", 5000);
  return subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function orderExists(id: string) {
  const page = await list({ prefix: orderPath(id), limit: 1, token: blobToken() });
  return page.blobs.length > 0;
}

export const writeOrder = (order: OrderInquiry) => writeJson(orderPath(order.id), order);
export const readOrder = (id: string) => readJson<OrderInquiry>(orderPath(id));

/** Ids of every saved order, from the folder listing only (cheap enough to poll). */
export async function listOrderIds(): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `${privateFolder()}/orders/`, cursor, limit: 1000, token: blobToken() });
    for (const b of page.blobs) ids.push(b.pathname.slice(b.pathname.lastIndexOf("/") + 1).replace(/\.json$/, ""));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return ids;
}

/**
 * Orders or return requests written in the last `sinceMs` milliseconds, newest
 * first. The folder listing says when each file was last written, so only
 * those few files are read. Used to spot floods of fake requests.
 */
export async function readRecent<T extends { createdAt: string }>(folder: "orders" | "returns", sinceMs: number, max = 100): Promise<T[]> {
  const since = Date.now() - sinceMs;
  const recent: { pathname: string; at: number }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `${privateFolder()}/${folder}/`, cursor, limit: 1000, token: blobToken() });
    for (const b of page.blobs) if (b.uploadedAt.getTime() >= since) recent.push({ pathname: b.pathname, at: b.uploadedAt.getTime() });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  recent.sort((a, b) => b.at - a.at);
  const items = await Promise.all(recent.slice(0, max).map((b) => readJson<T>(b.pathname).catch(() => null)));
  // Admin edits also rewrite files, so keep only ones actually created recently.
  return items.filter((it) => !!it && Date.parse(it.createdAt) >= since) as T[];
}

/* Customers' return and exchange requests. */
const returnPath = (id: string) => `${privateFolder()}/returns/${id}.json`;
export const writeReturn = (r: ReturnRequest) => writeJson(returnPath(r.id), r);
export const readReturn = (id: string) => readJson<ReturnRequest>(returnPath(id));
export const deleteReturn = async (id: string) => del(returnPath(id), { token: blobToken() });
export async function readReturns(): Promise<ReturnRequest[]> {
  const all = await readFolder<ReturnRequest>("returns", 500);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* Admin devices that asked for new-order notifications. */
const pushPath = (endpoint: string) => `${privateFolder()}/push/${createHash("sha256").update(endpoint).digest("hex").slice(0, 32)}.json`;
export const writePushSubscription = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) => writeJson(pushPath(sub.endpoint), sub);
export const deletePushSubscription = async (endpoint: string) => del(pushPath(endpoint), { token: blobToken() });
export const readPushSubscriptions = <T>() => readFolder<T>("push", 50);
export const deleteOrder = async (id: string) => del(orderPath(id), { token: blobToken() });
export const writeSubscriber = (sub: Subscriber) => writeJson(subscriberPath(sub.email), sub);

/** Uncached read for the admin, so it always edits the latest saved version. */
export async function readCatalogFresh(): Promise<Catalog | null> {
  if (!hasSharedStorage()) return null;
  const saved = await readJson<Partial<Catalog>>(CATALOG_PATH);
  return saved ? splitStoreData(normalizeStoreData({ ...saved, version: 1 })).catalog : null;
}
