import { createHash } from "node:crypto";
import { del, get, list, put } from "@vercel/blob";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { normalizeStoreData, splitStoreData, type Catalog } from "@/lib/repository";
import type { OrderInquiry, Subscriber } from "@/lib/types";

/**
 * Shared storage on Vercel Blob.
 *
 * - The public catalogue (products, settings, homepage…) lives in one JSON
 *   file. Customers read it through a cached server function.
 * - Orders and subscribers are one file each under a folder whose name is
 *   derived from a server secret, so their URLs cannot be guessed. Only the
 *   admin API lists and reads them.
 *
 * Without BLOB_READ_WRITE_TOKEN the site falls back to local demo mode.
 */

export const CATALOG_TAG = "catalog";
const CATALOG_PATH = "store/catalog.json";

export function hasSharedStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Server-only seed for names and keys that must stay stable and unguessable. */
export function serverSeed() {
  return process.env.ADMIN_SESSION_SECRET || process.env.BLOB_READ_WRITE_TOKEN || "tazhud";
}

function privateFolder() {
  return `private-${createHash("sha256").update(`tazhud-private:${serverSeed()}`).digest("hex").slice(0, 32)}`;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const res = await get(pathname, { access: "public", useCache: false });
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
    const page = await list({ prefix: `${privateFolder()}/${folder}/`, cursor, limit: 1000 });
    const items = await Promise.all(page.blobs.map((b) => readJson<T>(b.pathname).catch(() => null)));
    for (const it of items) if (it) out.push(it);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && out.length < limit);
  return out;
}

export async function readOrders(): Promise<OrderInquiry[]> {
  const orders = await readFolder<OrderInquiry>("orders", 500);
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readSubscribers(): Promise<Subscriber[]> {
  const subs = await readFolder<Subscriber>("subscribers", 5000);
  return subs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function orderExists(id: string) {
  const page = await list({ prefix: orderPath(id), limit: 1 });
  return page.blobs.length > 0;
}

export const writeOrder = (order: OrderInquiry) => writeJson(orderPath(order.id), order);
export const readOrder = (id: string) => readJson<OrderInquiry>(orderPath(id));

/** Ids of every saved order, from the folder listing only (cheap enough to poll). */
export async function listOrderIds(): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `${privateFolder()}/orders/`, cursor, limit: 1000 });
    for (const b of page.blobs) ids.push(b.pathname.slice(b.pathname.lastIndexOf("/") + 1).replace(/\.json$/, ""));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return ids;
}

/* Admin devices that asked for new-order notifications. */
const pushPath = (endpoint: string) => `${privateFolder()}/push/${createHash("sha256").update(endpoint).digest("hex").slice(0, 32)}.json`;
export const writePushSubscription = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) => writeJson(pushPath(sub.endpoint), sub);
export const deletePushSubscription = async (endpoint: string) => del(pushPath(endpoint));
export const readPushSubscriptions = <T>() => readFolder<T>("push", 50);
export const deleteOrder = async (id: string) => del(orderPath(id));
export const writeSubscriber = (sub: Subscriber) => writeJson(subscriberPath(sub.email), sub);

/** Uncached read for the admin, so it always edits the latest saved version. */
export async function readCatalogFresh(): Promise<Catalog | null> {
  if (!hasSharedStorage()) return null;
  const saved = await readJson<Partial<Catalog>>(CATALOG_PATH);
  return saved ? splitStoreData(normalizeStoreData({ ...saved, version: 1 })).catalog : null;
}
