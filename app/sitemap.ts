import type { MetadataRoute } from "next";
import { readCatalog } from "@/lib/server/storage";
import { seedProducts } from "@/lib/seed";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await readCatalog();
  const products = (catalog?.products ?? seedProducts).filter((p) => p.published);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/policies`, changeFrequency: "monthly", priority: 0.3 },
    ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
